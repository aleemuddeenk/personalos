from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import schemas, crud

router = APIRouter(prefix="/logs", tags=["Logs"])

@router.get("/today", response_model=List[schemas.TaskLogResponse])
def get_today_logs(db: Session = Depends(get_db)):
    return crud.get_today_logs(db=db)

@router.post("/{log_id}/complete", response_model=schemas.TaskLogResponse)
def complete_log(log_id: int, db: Session = Depends(get_db)):
    log = crud.mark_log_complete(db=db, log_id=log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Task log not found")
    return log
