from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import date, datetime

# --- SETTINGS SCHEMAS ---
class SettingBase(BaseModel):
    whatsapp_number: Optional[str] = None
    user_name: Optional[str] = None

class SettingCreate(SettingBase):
    pass

class SettingUpdate(SettingBase):
    pass

class SettingResponse(SettingBase):
    id: int

    class Config:
        from_attributes = True


# --- TASKS SCHEMAS ---
class TaskBase(BaseModel):
    name: str
    time: str = Field(..., description="Scheduled time in HH:MM format (24-hour style)")
    duration_minutes: int = Field(default=30)
    category: str = Field(default="Other")
    is_active: bool = True

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: int

    class Config:
        from_attributes = True


# --- TASK LOGS SCHEMAS ---
class TaskLogBase(BaseModel):
    task_id: int
    date: date
    status: str
    whatsapp_message_id: Optional[str] = None
    reminded_at: Optional[datetime] = None

class TaskLogResponse(BaseModel):
    id: int
    task_id: int
    date: date
    status: str
    whatsapp_message_id: Optional[str] = None
    reminded_at: Optional[datetime] = None
    task: TaskResponse

    class Config:
        from_attributes = True


# --- STUDY PLAN SCHEMAS ---
class StudyPlanCreate(BaseModel):
    exam_name: str
    exam_date: date
    lessons: List[str]
    daily_minutes: int

class StudyPlanResponse(BaseModel):
    id: int
    exam_name: str
    exam_date: date
    lessons: List[str]
    daily_minutes: int
    generated_schedule: Any  # JSON list/dict containing schedule days

    class Config:
        from_attributes = True


# --- REPORTS SCHEMAS ---
class DailyReportResponse(BaseModel):
    total_tasks: int
    completed_tasks: int
    failed_tasks: int
    completion_rate: float
    streak: int
    motivational_message: str

class MonthlyReportResponse(BaseModel):
    heatmap: dict  # Date-string -> status/rate
    best_streak: int
    total_completed: int
    most_failed_category: str
