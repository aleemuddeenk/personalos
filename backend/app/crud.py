from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from typing import Optional
from app import models, schemas

# --- SETTINGS CRUD ---
def get_settings(db: Session) -> models.Setting:
    # We maintain only one configuration record in the DB
    settings_record = db.query(models.Setting).filter(models.Setting.id == 1).first()
    if not settings_record:
        settings_record = models.Setting(id=1, whatsapp_number="", user_name="User")
        db.add(settings_record)
        db.commit()
        db.refresh(settings_record)
    return settings_record

def update_settings(db: Session, settings_in: schemas.SettingUpdate) -> models.Setting:
    settings_record = get_settings(db)
    if settings_in.whatsapp_number is not None:
        settings_record.whatsapp_number = settings_in.whatsapp_number
    if settings_in.user_name is not None:
        settings_record.user_name = settings_in.user_name
    db.commit()
    db.refresh(settings_record)

    # Automatically add a default daily task if none exist
    task_count = db.query(models.Task).count()
    if task_count == 0:
        default_task = models.Task(
            name="Daily Habit Check-in",
            time="20:00",
            duration_minutes=15,
            category="Habit",
            is_active=True
        )
        db.add(default_task)
        db.commit()
        db.refresh(default_task)
        
        # Import dynamically to avoid circular dependencies
        from app.scheduler import schedule_task_job
        try:
            schedule_task_job(default_task)
        except Exception as e:
            pass

    return settings_record


# --- TASKS CRUD ---
def get_tasks(db: Session, active_only: bool = False):
    query = db.query(models.Task)
    if active_only:
        query = query.filter(models.Task.is_active == True)
    return query.all()

def get_task(db: Session, task_id: int):
    return db.query(models.Task).filter(models.Task.id == task_id).first()

def create_task(db: Session, task_in: schemas.TaskCreate) -> models.Task:
    db_task = models.Task(
        name=task_in.name,
        time=task_in.time,
        duration_minutes=task_in.duration_minutes,
        category=task_in.category,
        is_active=task_in.is_active
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int) -> bool:
    db_task = get_task(db, task_id)
    if db_task:
        db.delete(db_task)
        db.commit()
        return True
    return False


# --- LOGS CRUD ---
def seed_today_logs(db: Session, target_date: date = None) -> list[models.TaskLog]:
    if target_date is None:
        target_date = date.today()
        
    active_tasks = get_tasks(db, active_only=True)
    logs_created = []
    
    for task in active_tasks:
        # Check if log already exists
        existing_log = db.query(models.TaskLog).filter(
            models.TaskLog.task_id == task.id,
            models.TaskLog.date == target_date
        ).first()
        
        if not existing_log:
            new_log = models.TaskLog(
                task_id=task.id,
                date=target_date,
                status="pending",
                whatsapp_message_id=None,
                reminded_at=None
            )
            db.add(new_log)
            logs_created.append(new_log)
            
    if logs_created:
        db.commit()
        
    # Query all logs for target date to return
    return db.query(models.TaskLog).filter(models.TaskLog.date == target_date).all()

def get_today_logs(db: Session, target_date: date = None):
    if target_date is None:
        target_date = date.today()
    
    # Always ensure today's logs are seeded when we fetch today's logs
    seed_today_logs(db, target_date)
    
    return db.query(models.TaskLog).filter(models.TaskLog.date == target_date).all()

def mark_log_complete(db: Session, log_id: int) -> Optional[models.TaskLog]:
    log = db.query(models.TaskLog).filter(models.TaskLog.id == log_id).first()
    if log:
        log.status = "completed"
        db.commit()
        db.refresh(log)
    return log

def mark_log_failed(db: Session, log_id: int) -> Optional[models.TaskLog]:
    log = db.query(models.TaskLog).filter(models.TaskLog.id == log_id).first()
    if log:
        # Only mark as failed if still pending
        if log.status == "pending":
            log.status = "failed"
            db.commit()
            db.refresh(log)
    return log

def get_log_by_whatsapp_id(db: Session, message_id: str) -> Optional[models.TaskLog]:
    return db.query(models.TaskLog).filter(models.TaskLog.whatsapp_message_id == message_id).first()

def get_recent_pending_log_for_whatsapp(db: Session) -> Optional[models.TaskLog]:
    # Find the most recently reminded task that is still pending
    return db.query(models.TaskLog).filter(
        models.TaskLog.status == "pending",
        models.TaskLog.whatsapp_message_id.isnot(None)
    ).order_by(models.TaskLog.reminded_at.desc()).first()


# --- STUDY PLAN CRUD ---
def create_study_plan(db: Session, plan_in: schemas.StudyPlanCreate, schedule: list) -> models.StudyPlan:
    db_plan = models.StudyPlan(
        exam_name=plan_in.exam_name,
        exam_date=plan_in.exam_date,
        lessons=plan_in.lessons,
        daily_minutes=plan_in.daily_minutes,
        generated_schedule=schedule
    )
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

def get_latest_study_plan(db: Session) -> Optional[models.StudyPlan]:
    return db.query(models.StudyPlan).order_by(models.StudyPlan.id.desc()).first()
