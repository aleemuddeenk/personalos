from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import schemas, crud

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=schemas.SettingResponse)
def get_settings(db: Session = Depends(get_db)):
    return crud.get_settings(db=db)

@router.post("", response_model=schemas.SettingResponse)
def save_settings(settings: schemas.SettingUpdate, db: Session = Depends(get_db)):
    return crud.update_settings(db=db, settings_in=settings)
