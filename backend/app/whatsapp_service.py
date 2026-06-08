import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger("whatsapp_service")
logging.basicConfig(level=logging.INFO)

class WhatsAppService:
    @staticmethod
    def send_text_message(to_number: str, text: str) -> Optional[str]:
        """
        Sends a WhatsApp message using Twilio API.
        Falls back to mock mode if credentials are not configured.
        """
        if not to_number:
            logger.warning("WhatsApp Service: No recipient number provided.")
            return None

        # Check if Twilio credentials are still placeholder values
        if (settings.TWILIO_ACCOUNT_SID == "your_twilio_account_sid"
                or settings.TWILIO_AUTH_TOKEN == "your_twilio_auth_token"):
            import uuid
            mock_sid = f"mock_sid_{uuid.uuid4().hex}"
            logger.info(f"[MOCK WHATSAPP] To: whatsapp:+{to_number} | Message: {text}")
            return mock_sid

        try:
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

            # to_number should be digits only e.g. 919876543210
            # TWILIO_WHATSAPP_FROM is your Twilio sandbox number e.g. +14155238886
            message = client.messages.create(
                from_=f"whatsapp:{settings.TWILIO_WHATSAPP_FROM}",
                to=f"whatsapp:+{to_number}",
                body=text
            )
            logger.info(f"Twilio WhatsApp message sent. SID: {message.sid}")
            return message.sid

        except Exception as e:
            logger.error(f"Error sending Twilio WhatsApp message: {e}")
            return None

    @classmethod
    def send_task_reminder(cls, to_number: str, task_name: str, duration: int) -> Optional[str]:
        text = f"Reminder: It's time for {task_name} ({duration} mins). Reply DONE when you finish!"
        return cls.send_text_message(to_number, text)

    @classmethod
    def send_morning_motivation(cls, to_number: str, message: str) -> Optional[str]:
        text = f"Good morning! Here's your daily boost:\n\n{message}\n\nLet's crush today!"
        return cls.send_text_message(to_number, text)

    @classmethod
    def send_daily_report(cls, to_number: str, total: int, completed: int, failed: int, rate: float, streak: int, motivation: str) -> Optional[str]:
        text = (
            f"Daily Report\n\n"
            f"Total Tasks: {total}\n"
            f"Completed: {completed}\n"
            f"Failed: {failed}\n"
            f"Rate: {rate:.1f}%\n"
            f"Streak: {streak} days\n\n"
            f"Coach says: {motivation}"
        )
        return cls.send_text_message(to_number, text)
