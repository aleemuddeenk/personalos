import os
import sys

# Add path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import settings
from app.whatsapp_service import WhatsAppService

# Test number
test_number = input("Enter your WhatsApp number (with country code, e.g., 919876543210 or 14155552671, no + sign): ").strip()
if not test_number:
    print("No number entered. Exiting.")
    sys.exit(0)

print(f"Sending test message using Twilio WhatsApp to: +{test_number}...")
sid = WhatsAppService.send_text_message(test_number, "Hello from PersonalOS! Your Twilio WhatsApp setup is working successfully! 🎉")

if sid and not sid.startswith("mock_"):
    print(f"Success! Message sent successfully. SID: {sid}")
elif sid and sid.startswith("mock_"):
    print(f"Mock mode: The credentials in .env are still placeholders. Mock SID generated: {sid}")
else:
    print("Failed to send message. Check the logs above or check your Twilio credentials in backend/.env.")
