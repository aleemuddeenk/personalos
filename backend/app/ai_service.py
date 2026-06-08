import json
import logging
import httpx
from datetime import date, timedelta
from typing import List, Dict, Any
from app.config import settings

logger = logging.getLogger("ai_service")

class AIService:
    @staticmethod
    def _call_claude(system_prompt: str, user_prompt: str) -> str:
        """
        Invokes Gemini API using httpx post request.
        Includes a rich fallback in case of missing or invalid API keys.
        """
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_gemini_key":
            logger.info("Gemini API key not set. Using local mock generator.")
            return ""

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        headers = {
            "content-type": "application/json"
        }
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{system_prompt}\n\n{user_prompt}"}
                    ]
                }
            ],
            "generationConfig": {
                "maxOutputTokens": 1024
            }
        }

        try:
            response = httpx.post(url, json=payload, headers=headers, timeout=20.0)
            if response.status_code == 200:
                resp_json = response.json()
                return resp_json["candidates"][0]["content"]["parts"][0]["text"].strip()
            logger.error(f"Gemini API failed with status {response.status_code}: {response.text}")
            return ""
        except Exception as e:
            logger.error(f"Exception calling Gemini API: {e}")
            return ""

    @classmethod
    def generate_study_schedule(cls, exam_name: str, exam_date: date, lessons: List[str], daily_minutes: int) -> List[Dict[str, Any]]:
        """
        Generates a day-by-day study schedule from today until the exam date.
        """
        today = date.today()
        days_available = (exam_date - today).days

        if days_available <= 0:
            return [{"date": str(today), "topic": f"Final review of {', '.join(lessons)}", "duration_minutes": daily_minutes}]

        system_prompt = (
            "You are an elite study strategist. Generate a structured day-by-day study timetable. "
            "Respond ONLY with a valid JSON array of objects. Do not include any markdown styling, conversational text, or wrapper. "
            "Format of each object in the array: "
            '{"date": "YYYY-MM-DD", "topic": "Brief specific chapter study goal", "duration_minutes": integer}'
        )

        user_prompt = (
            f"Exam Name: {exam_name}\n"
            f"Exam Date: {exam_date}\n"
            f"Lessons/Chapters to cover: {', '.join(lessons)}\n"
            f"Daily study budget: {daily_minutes} minutes\n"
            f"Start date: {today} (inclusive) until {exam_date} (exclusive).\n"
            f"Total available study days: {days_available} days.\n"
            f"Distribute the lessons logically over the days, adding periodic review sessions and a final mock test/revision before the exam."
        )

        gemini_response = cls._call_claude(system_prompt, user_prompt)

        if gemini_response:
            try:
                cleaned = gemini_response.strip()
                if cleaned.startswith("```json"):
                    cleaned = cleaned[7:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                schedule = json.loads(cleaned.strip())
                if isinstance(schedule, list):
                    return schedule
            except Exception as e:
                logger.error(f"Failed to parse Gemini schedule response: {e}. Raw response: {gemini_response}")

        # Fallback Mock Scheduler
        logger.info("Using Fallback Mock Study Scheduler.")
        schedule = []
        num_lessons = len(lessons)

        for i in range(days_available):
            current_date = today + timedelta(days=i)
            lesson_idx = i % num_lessons
            lesson = lessons[lesson_idx]

            if i == days_available - 1:
                topic = f"Final revision for {exam_name} & Mock exam"
            elif i % 5 == 4:
                topic = f"Active Recall & Review: {', '.join(lessons[:lesson_idx+1])}"
            else:
                topic = f"Study {exam_name}: Detailed review of '{lesson}'"

            schedule.append({
                "date": str(current_date),
                "topic": topic,
                "duration_minutes": daily_minutes
            })

        return schedule

    @classmethod
    def generate_morning_motivation(cls, user_name: str, tasks: List[str], current_streak: int) -> str:
        """
        Generates a short, direct, highly personalized coaching message for the morning (7 AM).
        """
        system_prompt = (
            "You are a friendly, direct, high-performance daily habits coach. "
            "Generate a highly motivating morning message in exactly 2-3 sentences. "
            "Do NOT include placeholders, emojis (unless very subtle), or generic quotes. "
            "Keep the tone direct, supportive, and energetic, focusing on action."
        )

        tasks_str = ", ".join(tasks) if tasks else "plan and build your consistency"
        user_prompt = (
            f"User name: {user_name}\n"
            f"Today's scheduled tasks: {tasks_str}\n"
            f"Current consecutive perfect days streak: {current_streak} days.\n"
            f"Compose a custom 2-3 sentence coaching push."
        )

        motivation = cls._call_claude(system_prompt, user_prompt)
        if motivation:
            return motivation

        # Fallback Mock Motivation
        if current_streak > 0:
            return f"Good morning, {user_name}! You're on a solid {current_streak}-day streak. Today we have {tasks_str} lined up. Focus on taking the first step early—consistency is where champions are built. Let's win today!"
        else:
            return f"Rise and shine, {user_name}! Today is a clean slate to build your momentum. We've got {tasks_str} scheduled. Tackle them with full focus and set the tone for a powerful week ahead. You've got this!"

    @classmethod
    def generate_evening_motivation(cls, user_name: str, completed_count: int, failed_count: int, rate: float) -> str:
        """
        Generates a short coaching message for the 9 PM daily report.
        """
        system_prompt = (
            "You are a direct, supportive personal growth coach. "
            "Generate a 2-sentence feedback reflection based on the user's daily performance. "
            "Maintain a constructive and realistic tone."
        )

        user_prompt = (
            f"User name: {user_name}\n"
            f"Tasks completed today: {completed_count}\n"
            f"Tasks failed today: {failed_count}\n"
            f"Completion rate: {rate:.1f}%\n"
            f"Provide a customized evening reflection."
        )

        reflection = cls._call_claude(system_prompt, user_prompt)
        if reflection:
            return reflection

        # Fallback Mock Reflection
        if rate == 100:
            return f"Incredible work today, {user_name}! A perfect 100% completion rate shows elite discipline. Rest up tonight, you've earned every bit of it."
        elif rate >= 50:
            return f"Solid effort today, {user_name}. You knocked out {completed_count} tasks. Let's study what tripped you up on the remaining items and aim for a stronger finish tomorrow."
        else:
            return f"Today was a challenging day, {user_name}. The important thing isn't the slip-up, but how you react tomorrow. Dust yourself off, rest well, and let's restart with high energy."