from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import schemas, crud, scheduler

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.post("", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    db_task = crud.create_task(db=db, task_in=task)
    # Schedule the recurring job dynamically
    if db_task.is_active:
        scheduler.schedule_task_job(db_task)
    return db_task

@router.get("", response_model=List[schemas.TaskResponse])
def read_tasks(db: Session = Depends(get_db)):
    return crud.get_tasks(db=db)

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = crud.get_task(db=db, task_id=task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Remove dynamic job from scheduler
    scheduler.unschedule_task_job(task_id)
    crud.delete_task(db=db, task_id=task_id)
    return None
