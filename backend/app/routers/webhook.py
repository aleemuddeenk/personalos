import logging
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app import crud, models
from app.whatsapp_service import WhatsAppService

router = APIRouter(prefix="/webhook/whatsapp", tags=["WhatsApp Webhook"])
logger = logging.getLogger("webhook")

@router.get("")
def verify_webhook(request: Request):
    """
    Verification endpoint for Meta WhatsApp API Webhook setup.
    Meta makes a GET request to verify our server is active and using the correct verify token.
    """
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    if mode and token:
        if mode == "subscribe" and token == settings.WHATSAPP_VERIFY_TOKEN:
            logger.info("Webhook verified successfully by Meta.")
            return Response(content=challenge, media_type="text/plain")
        else:
            logger.warning(f"Webhook verification failed. Token mismatch: received {token}, expected {settings.WHATSAPP_VERIFY_TOKEN}")
            raise HTTPException(status_code=403, detail="Verification token mismatch")
            
    raise HTTPException(status_code=400, detail="Missing verification parameters")

def parse_add_task_message(text: str):
    import re
    # 1. Match 12-hour time with colon (e.g. 6:30 PM, 6:30pm, 10:15 am)
    match_12 = re.search(r'\b(1[0-2]|0?[1-9]):([0-5][0-9])\s*(AM|PM|am|pm|Am|Pm)\b', text)
    # 2. Match 24-hour time with colon (e.g. 18:30 or 06:30)
    match_24 = re.search(r'\b([0-1]?[0-9]|2[0-3]):([0-5][0-9])\b', text)
    # 3. Match 12-hour time without colon (e.g. 9 PM, 9pm)
    match_12_no_colon = re.search(r'\b(1[0-2]|0?[1-9])\s*(AM|PM|am|pm|Am|Pm)\b', text)
    
    time_str = None
    time_raw = None
    
    if match_12:
        time_raw = match_12.group(0)
        hour = int(match_12.group(1))
        minute = int(match_12.group(2))
        period = match_12.group(3).upper()
        if period == "PM" and hour < 12:
            hour += 12
        elif period == "AM" and hour == 12:
            hour = 0
        time_str = f"{hour:02d}:{minute:02d}"
    elif match_24:
        time_raw = match_24.group(0)
        hour = int(match_24.group(1))
        minute = int(match_24.group(2))
        time_str = f"{hour:02d}:{minute:02d}"
    elif match_12_no_colon:
        time_raw = match_12_no_colon.group(0)
        hour = int(match_12_no_colon.group(1))
        minute = 0
        period = match_12_no_colon.group(2).upper()
        if period == "PM" and hour < 12:
            hour += 12
        elif period == "AM" and hour == 12:
            hour = 0
        time_str = f"{hour:02d}:{minute:02d}"
        
    if not time_str:
        return None
        
    # Extract the task name
    # Remove command prefix "add task" or "add" (case-insensitive)
    name_part = text
    name_part = re.sub(r'(?i)^\s*add\s+task\s+', '', name_part)
    name_part = re.sub(r'(?i)^\s*add\s+', '', name_part)
    
    # Remove the time part from the text
    name_part = name_part.replace(time_raw, '')
    
    # Remove " at " if it exists (case-insensitive)
    name_part = re.sub(r'(?i)\s+at\s+', ' ', name_part)
    
    # Clean up whitespace
    name = re.sub(r'\s+', ' ', name_part).strip()
    
    if not name:
        return None
        
    return {"name": name, "time": time_str}


@router.post("")
async def receive_webhook_message(request: Request, db: Session = Depends(get_db)):
    """
    Endpoint that receives webhook notifications when a user sends a message back to our number.
    Handles both Twilio (x-www-form-urlencoded) and Meta (JSON) webhook formats.
    Processes replies like "DONE" or "done" to mark tasks as complete.
    """
    try:
        content_type = request.headers.get("content-type", "")
        
        sender_number = None
        text_body = None

        if "application/x-www-form-urlencoded" in content_type:
            # Twilio webhook format
            form_data = await request.form()
            from_field = form_data.get("From", "")  # e.g. "whatsapp:+918838820040"
            if from_field.startswith("whatsapp:+"):
                sender_number = from_field[len("whatsapp:+"):]
            elif from_field.startswith("whatsapp:"):
                sender_number = from_field[len("whatsapp:"):]
            
            text_body = form_data.get("Body", "").strip()
            logger.info(f"Received Twilio WhatsApp webhook: from={sender_number}, body='{text_body}'")
        else:
            # Meta JSON format fallback
            body = await request.json()
            logger.info(f"Received Meta WhatsApp webhook payload: {body}")
            entries = body.get("entry", [])
            for entry in entries:
                changes = entry.get("changes", [])
                for change in changes:
                    value = change.get("value", {})
                    messages = value.get("messages", [])
                    for msg in messages:
                        sender_number = msg.get("from")
                        msg_type = msg.get("type")
                        if msg_type == "text":
                            text_body = msg.get("text", {}).get("body", "").strip()

        if sender_number and text_body:
            logger.info(f"Processing message from {sender_number}: '{text_body}'")
            msg_upper = text_body.upper().strip()
            
            # Check if the user replied "DONE" (case-insensitive)
            if msg_upper == "DONE":
                # Retrieve the most recent pending task log that has been reminded
                log = crud.get_recent_pending_log_for_whatsapp(db)
                
                if log:
                    # Mark as complete
                    crud.mark_log_complete(db, log.id)
                    logger.info(f"Marked log {log.id} for task '{log.task.name}' as completed via WhatsApp!")
                    
                    # Send acknowledgment back to WhatsApp
                    task_name = log.task.name if log.task else "Task"
                    WhatsAppService.send_text_message(
                        to_number=sender_number,
                        text=f"✅ Got it! '{task_name}' has been marked as COMPLETED. Keep up the amazing work! 🎉"
                    )
                else:
                    logger.warning(f"Received DONE from {sender_number} but found no active pending reminder.")
                    WhatsAppService.send_text_message(
                        to_number=sender_number,
                        text="⏰ I received 'DONE', but couldn't find an active pending task reminder. Make sure to complete them on time!"
                    )
            elif msg_upper in ["TASK", "TASKS"]:
                logs = crud.get_today_logs(db)
                if not logs:
                    reply = "📅 No tasks scheduled for today."
                else:
                    reply_lines = ["📅 Today's Tasks:"]
                    logs = sorted(logs, key=lambda l: l.task.time if l.task else "")
                    for l in logs:
                        if not l.task:
                            continue
                        status_icon = "✅" if l.status == "completed" else ("❌" if l.status == "failed" else "⏳")
                        reply_lines.append(f"{status_icon} {l.task.time} - {l.task.name} ({l.status})")
                    reply = "\n".join(reply_lines)
                
                WhatsAppService.send_text_message(to_number=sender_number, text=reply)
                
            elif msg_upper in ["COMPLETE", "COMPLETED"]:
                logs = crud.get_today_logs(db)
                completed_logs = [l for l in logs if l.status == "completed" and l.task]
                if not completed_logs:
                    reply = "✅ No completed tasks for today yet. Keep going!"
                else:
                    reply_lines = ["✅ Completed Tasks Today:"]
                    completed_logs = sorted(completed_logs, key=lambda l: l.task.time)
                    for l in completed_logs:
                        reply_lines.append(f"• {l.task.time} - {l.task.name}")
                    reply = "\n".join(reply_lines)
                
                WhatsAppService.send_text_message(to_number=sender_number, text=reply)
                
            elif msg_upper in ["INCOMPLETE", "INCOMPLETED", "PENDING"]:
                logs = crud.get_today_logs(db)
                incomplete_logs = [l for l in logs if l.status in ["pending", "failed"] and l.task]
                if not incomplete_logs:
                    reply = "🎉 Amazing! You have no incomplete tasks today!"
                else:
                    reply_lines = ["⏰ Incomplete Tasks Today:"]
                    incomplete_logs = sorted(incomplete_logs, key=lambda l: l.task.time)
                    for l in incomplete_logs:
                        status_str = "pending" if l.status == "pending" else "failed/overdue"
                        reply_lines.append(f"• {l.task.time} - {l.task.name} ({status_str})")
                    reply = "\n".join(reply_lines)
                
                WhatsAppService.send_text_message(to_number=sender_number, text=reply)
                
            elif msg_upper.startswith("ADD ") or msg_upper.startswith("ADD TASK "):
                parsed = parse_add_task_message(text_body)
                if parsed:
                    from app import schemas, scheduler
                    task_data = schemas.TaskCreate(
                        name=parsed["name"],
                        time=parsed["time"],
                        duration_minutes=30,  # Default budget
                        category="Habit"
                    )
                    db_task = crud.create_task(db, task_data)
                    scheduler.schedule_task_job(db_task)
                    
                    # Seed today's log for this new task
                    crud.seed_today_logs(db)
                    
                    reply = f"✅ Success! Added daily task '{db_task.name}' scheduled for {db_task.time}."
                else:
                    reply = "❌ Could not parse task details. Please use format: 'add task [Name] at [Time]' (e.g. 'add task Workout at 6:30 PM' or 'add Study 18:00')."
                
                WhatsAppService.send_text_message(to_number=sender_number, text=reply)
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error handling WhatsApp webhook message: {e}")
        return {"status": "ignored", "error": str(e)}
