from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import schemas, crud, scheduler
from app.ai_service import AIService

router = APIRouter(prefix="/study-plan", tags=["Study Plans"])

@router.post("", response_model=schemas.StudyPlanResponse, status_code=status.HTTP_201_CREATED)
def create_study_plan(plan: schemas.StudyPlanCreate, db: Session = Depends(get_db)):
    # 1. Call Claude to generate the timetable
    schedule = AIService.generate_study_schedule(
        exam_name=plan.exam_name,
        exam_date=plan.exam_date,
        lessons=plan.lessons,
        daily_minutes=plan.daily_minutes
    )

    if not schedule:
        raise HTTPException(
            status_code=500,
            detail="AI failed to generate a study timetable. Please try again."
        )

    # 2. Save Study Plan in Database
    db_plan = crud.create_study_plan(db=db, plan_in=plan, schedule=schedule)

    # 3. Auto-inject study sessions into the recurring tasks list
    # We will inject the sessions as daily tasks so they trigger WhatsApp reminders and appear in the "Due Today" list
    for idx, session in enumerate(schedule):
        # Create a specific task for this study session
        # Cycle study times slightly so they look realistic (e.g., 17:00, 18:00, 19:00)
        time_slot = "18:00"
        if idx % 3 == 0:
            time_slot = "17:00"
        elif idx % 3 == 2:
            time_slot = "19:00"
            
        task_in = schemas.TaskCreate(
            name=session["topic"],
            time=time_slot,
            duration_minutes=session["duration_minutes"],
            category="Study",
            is_active=True
        )
        
        # Save task to DB
        db_task = crud.create_task(db=db, task_in=task_in)
        # Register in scheduler
        scheduler.schedule_task_job(db_task)

    return db_plan

@router.get("/latest", response_model=schemas.StudyPlanResponse)
def get_latest_plan(db: Session = Depends(get_db)):
    plan = crud.get_latest_study_plan(db=db)
    if not plan:
        raise HTTPException(status_code=404, detail="No study plan found")
    return plan
