import logging
from datetime import datetime, date, time, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import crud, models
from app.whatsapp_service import WhatsAppService
from app.ai_service import AIService

logger = logging.getLogger("scheduler")
scheduler = BackgroundScheduler()

# Helper to run database operations inside a clean session
def get_db_session():
    return SessionLocal()

# --- TRIGGER ACTIONS ---

def send_task_reminder_trigger(task_id: int):
    """
    Called at the task's scheduled time.
    Sends WhatsApp message and schedules the 20-min grace check.
    """
    logger.info(f"Triggering reminder for task_id: {task_id}")
    db = get_db_session()
    try:
        task = crud.get_task(db, task_id)
        if not task or not task.is_active:
            logger.warning(f"Task {task_id} not found or inactive. Skipping.")
            return

        settings = crud.get_settings(db)
        if not settings.whatsapp_number:
            logger.warning("No WhatsApp number set in settings. Skipping reminder.")
            return

        # Ensure today's logs are seeded
        today = date.today()
        crud.seed_today_logs(db, today)

        # Get log for today
        log = db.query(models.TaskLog).filter(
            models.TaskLog.task_id == task_id,
            models.TaskLog.date == today
        ).first()

        if not log:
            logger.error(f"TaskLog not found for task {task_id} on {today}")
            return

        # If already completed manually, don't send reminder
        if log.status == "completed":
            logger.info(f"Task {task_id} already marked completed. Skipping reminder.")
            return

        # Send WhatsApp Message
        wamid = WhatsAppService.send_task_reminder(
            to_number=settings.whatsapp_number,
            task_name=task.name,
            duration=task.duration_minutes
        )

        # Update log
        log.whatsapp_message_id = wamid
        log.reminded_at = datetime.now()
        db.commit()

        # Schedule the 20-minute failure check
        check_time = datetime.now() + timedelta(minutes=20)
        job_id = f"check_{log.id}"
        scheduler.add_job(
            check_task_completion_timeout,
            'date',
            run_date=check_time,
            id=job_id,
            args=[log.id],
            replace_existing=True
        )
        logger.info(f"Scheduled 20-min safety check for log {log.id} at {check_time}")

    except Exception as e:
        logger.error(f"Error in send_task_reminder_trigger: {e}")
    finally:
        db.close()


def check_task_completion_timeout(log_id: int):
    """
    Runs 20 minutes after a reminder is sent.
    Marks the log as FAILED if still pending.
    """
    logger.info(f"Running 20-min timeout check for log_id: {log_id}")
    db = get_db_session()
    try:
        log = db.query(models.TaskLog).filter(models.TaskLog.id == log_id).first()
        if log and log.status == "pending":
            log.status = "failed"
            db.commit()
            logger.info(f"Log {log_id} marked as FAILED due to 20-min inactivity.")
            
            # Send optional WhatsApp notice of failure
            settings = crud.get_settings(db)
            if settings.whatsapp_number:
                task_name = log.task.name if log.task else "Scheduled Task"
                WhatsAppService.send_text_message(
                    to_number=settings.whatsapp_number,
                    text=f"❌ Time's up! The task '{task_name}' was marked as FAILED. Consistency is key, let's crush the next one!"
                )
    except Exception as e:
        logger.error(f"Error in check_task_completion_timeout: {e}")
    finally:
        db.close()


def run_morning_motivation_trigger():
    """
    Triggers daily at 7 AM.
    Generates motivation and sends via WhatsApp.
    """
    logger.info("Triggering morning motivation...")
    db = get_db_session()
    try:
        settings = crud.get_settings(db)
        if not settings.whatsapp_number:
            logger.warning("No WhatsApp number set. Morning motivation skipped.")
            return

        # Fetch today's tasks
        today = date.today()
        logs = crud.get_today_logs(db, today)
        task_names = [log.task.name for log in logs if log.task]

        # Calculate streak
        streak = calculate_streak(db)

        # Generate motivation
        msg = AIService.generate_morning_motivation(
            user_name=settings.user_name or "User",
            tasks=task_names,
            current_streak=streak
        )

        # Send
        WhatsAppService.send_morning_motivation(settings.whatsapp_number, msg)

    except Exception as e:
        logger.error(f"Error in run_morning_motivation_trigger: {e}")
    finally:
        db.close()


def run_evening_report_trigger():
    """
    Triggers daily at 9 PM.
    Compiles today's summary, calls Claude, and sends via WhatsApp.
    """
    logger.info("Triggering evening report...")
    db = get_db_session()
    try:
        settings = crud.get_settings(db)
        if not settings.whatsapp_number:
            logger.warning("No WhatsApp number set. Evening report skipped.")
            return

        today = date.today()
        logs = crud.get_today_logs(db, today)
        
        # Calculate stats
        total = len(logs)
        completed = sum(1 for log in logs if log.status == "completed")
        failed = sum(1 for log in logs if log.status == "failed")
        rate = (completed / total * 100) if total > 0 else 0.0

        # Overdue checks: mark remaining 'pending' as 'failed'
        for log in logs:
            if log.status == "pending":
                log.status = "failed"
                failed += 1
        if total > 0:
            rate = (completed / total * 100)
        db.commit()

        streak = calculate_streak(db)

        # Generate Claude comment
        motivation = AIService.generate_evening_motivation(
            user_name=settings.user_name or "User",
            completed_count=completed,
            failed_count=failed,
            rate=rate
        )

        # Send WhatsApp Report
        WhatsAppService.send_daily_report(
            to_number=settings.whatsapp_number,
            total=total,
            completed=completed,
            failed=failed,
            rate=rate,
            streak=streak,
            motivation=motivation
        )

    except Exception as e:
        logger.error(f"Error in run_evening_report_trigger: {e}")
    finally:
        db.close()


def run_midnight_seeding():
    """
    Seeds tomorrow's logs in advance.
    """
    logger.info("Running midnight seeding for tasks...")
    db = get_db_session()
    try:
        crud.seed_today_logs(db, date.today())
        logger.info("Seeding complete.")
    except Exception as e:
        logger.error(f"Error in run_midnight_seeding: {e}")
    finally:
        db.close()


# --- STREAK CALCULATION HELPER ---

def calculate_streak(db: Session) -> int:
    """
    Calculates current consecutive days with 100% task completion.
    Checks backwards starting from yesterday.
    """
    streak = 0
    check_date = date.today() - timedelta(days=1)
    
    while True:
        logs = db.query(models.TaskLog).filter(models.TaskLog.date == check_date).all()
        if not logs:
            # If no tasks were scheduled on this past day, let's stop counting streak
            break
        
        total = len(logs)
        completed = sum(1 for log in logs if log.status == "completed")
        
        if total > 0 and completed == total:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break
            
    return streak


# --- SCHEDULER MANAGEMENT ---

def start_scheduler():
    """
    Registers permanent and dynamic tasks on server initialization.
    """
    if not scheduler.running:
        scheduler.start()
        logger.info("Background Scheduler started.")

    db = get_db_session()
    try:
        # 1. Register base cron routines
        # Midnight seeding
        scheduler.add_job(
            run_midnight_seeding,
            CronTrigger(hour=0, minute=0),
            id="midnight_seeding",
            replace_existing=True
        )

        # 7 AM morning motivation
        scheduler.add_job(
            run_morning_motivation_trigger,
            CronTrigger(hour=7, minute=0),
            id="morning_motivation",
            replace_existing=True
        )

        # 9 PM daily report summary
        scheduler.add_job(
            run_evening_report_trigger,
            CronTrigger(hour=21, minute=0),
            id="evening_report",
            replace_existing=True
        )

        # 2. Register all active user tasks
        active_tasks = crud.get_tasks(db, active_only=True)
        for task in active_tasks:
            schedule_task_job(task)
            
        logger.info(f"Registered {len(active_tasks)} active dynamic task reminders.")
    except Exception as e:
        logger.error(f"Error in start_scheduler: {e}")
    finally:
        db.close()


def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Background Scheduler shutdown.")


def schedule_task_job(task: models.Task):
    """
    Adds or updates a dynamic cron timer for a daily task.
    """
    try:
        hour, minute = map(int, task.time.split(":"))
        job_id = f"task_{task.id}"
        scheduler.add_job(
            send_task_reminder_trigger,
            'cron',
            hour=hour,
            minute=minute,
            id=job_id,
            args=[task.id],
            replace_existing=True
        )
        logger.info(f"Scheduled cron job for task '{task.name}' (ID: {task.id}) at {task.time}")
    except Exception as e:
        logger.error(f"Failed to schedule task job {task.id}: {e}")


def unschedule_task_job(task_id: int):
    """
    Removes a scheduled dynamic task reminder.
    """
    job_id = f"task_{task_id}"
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
        logger.info(f"Unscheduled cron job for task ID: {task_id}")
