from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    time = Column(String, nullable=False)  # Format: "HH:MM"
    duration_minutes = Column(Integer, default=30)
    category = Column(String, default="Other")  # Study / Exercise / Work / Habit / Other
    is_active = Column(Boolean, default=True)

    logs = relationship("TaskLog", back_populates="task", cascade="all, delete-orphan")

class TaskLog(Base):
    __tablename__ = "task_logs"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)  # The date this log is for
    status = Column(String, default="pending")  # pending / completed / failed
    whatsapp_message_id = Column(String, nullable=True)
    reminded_at = Column(DateTime, nullable=True)

    task = relationship("Task", back_populates="logs")

class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    exam_name = Column(String, nullable=False)
    exam_date = Column(Date, nullable=False)
    lessons = Column(JSON, nullable=False)  # List of strings/lessons
    daily_minutes = Column(Integer, nullable=False)
    generated_schedule = Column(JSON, nullable=False)  # Generated study calendar

class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    whatsapp_number = Column(String, nullable=True)
    user_name = Column(String, nullable=True)
