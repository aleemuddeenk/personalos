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
            # Check if the user replied "DONE" (case-insensitive)
            if text_body.upper() == "DONE":
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
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error handling WhatsApp webhook message: {e}")
        return {"status": "ignored", "error": str(e)}
