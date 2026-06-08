import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app import crud, scheduler
from app.routers import tasks, logs, study_plans, reports, settings, webhook

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("main")

# Initialize DB Tables (SQLite / Postgres)
Base.metadata.create_all(bind=engine)
logger.info("Database tables initialized successfully.")

# Setup FastAPI application
app = FastAPI(
    title="PersonalOS API",
    description="Backend services for task tracking, WhatsApp automated reminders, study plan generation, and AI morning/evening coaching.",
    version="1.0.0"
)

# CORS middleware to allow connection from Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev/render ease. In production, narrow this down.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(tasks.router)
app.include_router(logs.router)
app.include_router(study_plans.router)
app.include_router(reports.router)
app.include_router(settings.router)
app.include_router(webhook.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to PersonalOS API. Everything is running smoothly!"}

# Startup & Shutdown actions
@app.on_event("startup")
def startup_event():
    logger.info("Initializing PersonalOS Startup Routine...")
    
    # 1. Seed today's logs immediately on boot
    db = SessionLocal()
    try:
        seeded_count = len(crud.seed_today_logs(db))
        logger.info(f"Today's task logs seeded successfully: {seeded_count} records checked/seeded.")
    except Exception as e:
        logger.error(f"Error seeding logs on startup: {e}")
    finally:
        db.close()
        
    # 2. Start the background cron scheduler
    scheduler.start_scheduler()
    logger.info("PersonalOS Startup complete.")

@app.on_event("shutdown")
def shutdown_event():
    logger.info("Initiating PersonalOS Shutdown Routine...")
    scheduler.shutdown_scheduler()
    logger.info("PersonalOS Shutdown complete.")
