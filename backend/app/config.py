import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./personalos.db"

    # Twilio WhatsApp credentials
    TWILIO_ACCOUNT_SID: str = "your_twilio_account_sid"
    TWILIO_AUTH_TOKEN: str = "your_twilio_auth_token"
    TWILIO_WHATSAPP_FROM: str = "+14155238886"  # Twilio sandbox default number

    # Gemini AI API
    GEMINI_API_KEY: str = "your_gemini_key"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
