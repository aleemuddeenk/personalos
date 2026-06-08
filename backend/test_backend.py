import os
import sys
import unittest
from datetime import date

# Set mock env variables before imports to prevent crashes
os.environ["WHATSAPP_TOKEN"] = "mock_token"
os.environ["WHATSAPP_PHONE_NUMBER_ID"] = "mock_phone_id"
os.environ["WHATSAPP_VERIFY_TOKEN"] = "mock_verify_token"
os.environ["GEMINI_API_KEY"] = "mock_gemini_key"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

# Adjust sys path so we can import the backend app module cleanly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app
from app import models, crud, schemas
from app.ai_service import AIService

class TestPersonalOSCore(unittest.TestCase):
    def setUp(self):
        # 1. Spin up an in-memory SQLite database
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()
        
        # 2. Add dynamic setup database mocks to FastAPI app dependency overrides
        def override_get_db():
            db = self.Session()
            try:
                yield db
            finally:
                db.close()
        app.dependency_overrides[get_db] = override_get_db

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(self.engine)
        app.dependency_overrides.clear()

    def test_settings_initialization_and_update(self):
        """Verify settings are auto-initialized and can be successfully saved."""
        settings = crud.get_settings(self.db)
        self.assertIsNotNone(settings)
        self.assertEqual(settings.user_name, "User")
        
        # Update settings
        update_schema = schemas.SettingUpdate(user_name="John Doe", whatsapp_number="123456789")
        updated = crud.update_settings(self.db, update_schema)
        self.assertEqual(updated.user_name, "John Doe")
        self.assertEqual(updated.whatsapp_number, "123456789")

    def test_task_creation_and_deletion(self):
        """Verify tasks are successfully written to database."""
        task_in = schemas.TaskCreate(
            name="Gym Session",
            time="07:00",
            duration_minutes=45,
            category="Exercise",
            is_active=True
        )
        task = crud.create_task(self.db, task_in)
        self.assertIsNotNone(task.id)
        self.assertEqual(task.name, "Gym Session")
        
        # Read tasks
        tasks = crud.get_tasks(self.db)
        self.assertEqual(len(tasks), 1)
        
        # Delete task
        success = crud.delete_task(self.db, task.id)
        self.assertTrue(success)
        self.assertEqual(len(crud.get_tasks(self.db)), 0)

    def test_logs_seeding_and_checkoff(self):
        """Verify today's logs seed correctly and can be completed."""
        task_in = schemas.TaskCreate(
            name="Read Book",
            time="21:00",
            duration_minutes=30,
            category="Habit",
            is_active=True
        )
        task = crud.create_task(self.db, task_in)
        
        # Seed today's logs
        today = date.today()
        logs = crud.seed_today_logs(self.db, today)
        self.assertEqual(len(logs), 1)
        self.assertEqual(logs[0].status, "pending")
        self.assertEqual(logs[0].task.name, "Read Book")

        # Mark completed
        completed = crud.mark_log_complete(self.db, logs[0].id)
        self.assertEqual(completed.status, "completed")

    def test_study_plan_generation_fallback(self):
        """Verify study schedule fallback works smoothly."""
        lessons = ["Math", "Physics", "Chemistry"]
        exam_date = datetime_delta(5)
        
        schedule = AIService.generate_study_schedule(
            exam_name="Science Finals",
            exam_date=exam_date,
            lessons=lessons,
            daily_minutes=90
        )
        
        self.assertTrue(len(schedule) > 0)
        self.assertEqual(schedule[0]["duration_minutes"], 90)
        self.assertIn("Science Finals", schedule[0]["topic"])


def datetime_delta(days):
    from datetime import timedelta
    return date.today() + timedelta(days=days)


if __name__ == "__main__":
    unittest.main()
