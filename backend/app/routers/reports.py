from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from collections import defaultdict
from app.database import get_db
from app import schemas, crud, models, scheduler
from app.ai_service import AIService

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/daily", response_model=schemas.DailyReportResponse)
def get_daily_report(db: Session = Depends(get_db)):
    settings = crud.get_settings(db)
    today = date.today()
    logs = crud.get_today_logs(db, today)
    
    total = len(logs)
    completed = sum(1 for log in logs if log.status == "completed")
    failed = sum(1 for log in logs if log.status == "failed")
    rate = (completed / total * 100) if total > 0 else 0.0
    
    # Calculate streak
    streak = scheduler.calculate_streak(db)
    
    # If the user completed all tasks today, increase the streak count dynamically for today's visual feedback
    if total > 0 and completed == total:
        streak += 1

    # Call AI for daily personalized coach comment
    motivational_message = AIService.generate_evening_motivation(
        user_name=settings.user_name or "User",
        completed_count=completed,
        failed_count=failed,
        rate=rate
    )

    return schemas.DailyReportResponse(
        total_tasks=total,
        completed_tasks=completed,
        failed_tasks=failed,
        completion_rate=rate,
        streak=streak,
        motivational_message=motivational_message
    )

@router.get("/monthly", response_model=schemas.MonthlyReportResponse)
def get_monthly_report(month: str = Query(..., description="Format: YYYY-MM"), db: Session = Depends(get_db)):
    try:
        year_str, month_str = month.split("-")
        year = int(year_str)
        month_val = int(month_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid month format. Must be YYYY-MM")

    # Fetch all logs in this month
    # We query logs between start of month and end of month
    start_date = date(year, month_val, 1)
    if month_val == 12:
        end_date = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        end_date = date(year, month_val + 1, 1) - timedelta(days=1)

    logs = db.query(models.TaskLog).filter(
        models.TaskLog.date >= start_date,
        models.TaskLog.date <= end_date
    ).all()

    # Calculate completion rates per day
    daily_stats = defaultdict(lambda: {"total": 0, "completed": 0})
    for log in logs:
        date_str = str(log.date)
        daily_stats[date_str]["total"] += 1
        if log.status == "completed":
            daily_stats[date_str]["completed"] += 1

    heatmap = {}
    total_completed = 0
    for day_str, stats in daily_stats.items():
        total = stats["total"]
        completed = stats["completed"]
        rate = (completed / total * 100) if total > 0 else 0.0
        heatmap[day_str] = round(rate, 1)
        total_completed += completed

    # Calculate most failed category
    failed_logs = db.query(models.TaskLog).join(models.Task).filter(
        models.TaskLog.date >= start_date,
        models.TaskLog.date <= end_date,
        models.TaskLog.status == "failed"
    ).all()

    failed_categories = defaultdict(int)
    for log in failed_logs:
        if log.task:
            failed_categories[log.task.category] += 1

    most_failed = "None"
    if failed_categories:
        most_failed = max(failed_categories, key=failed_categories.get)

    # Calculate best streak in the month
    # We trace consecutive perfect days (rate == 100%) during this month
    best_streak = 0
    current_streak = 0
    
    current_check = start_date
    while current_check <= end_date:
        day_str = str(current_check)
        stats = daily_stats.get(day_str)
        if stats and stats["total"] > 0 and stats["completed"] == stats["total"]:
            current_streak += 1
            if current_streak > best_streak:
                best_streak = current_streak
        else:
            current_streak = 0
        current_check += timedelta(days=1)

    return schemas.MonthlyReportResponse(
        heatmap=heatmap,
        best_streak=best_streak,
        total_completed=total_completed,
        most_failed_category=most_failed
    )
