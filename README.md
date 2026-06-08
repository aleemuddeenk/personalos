# PersonalOS ⏰ — Dynamic Habits Tracker & AI Study Planner

PersonalOS is a state-of-the-art personal workspace dashboard designed to automate daily growth, track recurring habits, plan curriculum exam schedules, and keep you highly disciplined using automated **Twilio WhatsApp reminders** and personalized morning/evening **Gemini AI coaching**.

---

## 🚀 Key Features

1. **Structured Habits Tracker**: Define recurring daily goals across five categories (Study, Exercise, Work, Habit, and Other) that reset automatically each day.
2. **Twilio WhatsApp Integration**: Receive precise WhatsApp alarms at scheduled goal times. Reply `DONE` to the message within 20 minutes to automatically log task success, otherwise, the system marks the task as failed.
3. **AI Study Planner**: Feed an exam name, target date, study lessons, and daily minutes availability to Gemini AI, generating a structured daily split timetable that auto-injects sessions into your dynamic WhatsApp active checklist.
4. **AI Coach Motivation**: Receive a direct, coach-like morning text reminder at 7 AM summarizing your goals and consecutive perfect streaks, followed by a statistical completion report card at 9 PM.
5. **Interactive Completion Heatmaps**: Click and navigate month-by-month calendar heatmaps representing completion percentages per day, highlighting tough categories and streak counts.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS (Outfit & Inter fonts, Glassmorphism card panels, dynamic hover animations, progress dials).
- **Backend**: Python + FastAPI (Modular router structure, Pydantic type checking).
- **Scheduler**: APScheduler (Midnight seeding, dynamic task alarms, 20-minute safety timeouts).
- **AI Engine**: Gemini API (`gemini-1.5-flash`) using direct API connection services.
- **Database**: SQLite (Local Dev) ➔ PostgreSQL (Production via Render/Railway).

---

## 📂 Project Structure

```
personalos/
├── backend/
│   ├── app/
│   │   ├── config.py             # BaseSettings configuration loader
│   │   ├── database.py           # DB Engine configuration (SQLite/Postgres)
│   │   ├── models.py             # SQLAlchemy schemas definitions
│   │   ├── schemas.py            # Pydantic data schemas
│   │   ├── crud.py               # Database CRUD logic routines
│   │   ├── whatsapp_service.py   # Twilio WhatsApp API communications
│   │   ├── ai_service.py         # Gemini AI API connections
│   │   ├── scheduler.py          # APScheduler background tasks manager
│   │   ├── main.py               # FastAPI bootstrapper
│   │   └── routers/              # API router files
│   │       ├── tasks.py
│   │       ├── logs.py
│   │       ├── study_plans.py
│   │       ├── reports.py
│   │       ├── settings.py
│   │       └── webhook.py
│   ├── requirements.txt          # Backend packages
│   └── test_backend.py           # Automated test client routines
├── frontend/
│   ├── src/
│   │   ├── components/           # Shared views (Navbar, Layout, Heatmap, TaskItem)
│   │   ├── pages/                # Views (Home, Tasks, StudyPlanner, Reports, Settings)
│   │   ├── api.js                # Axios client configurations
│   │   ├── App.jsx               # App routing
│   │   ├── main.jsx              # DOM entrypoint
│   │   └── index.css             # Tailwind imports & dynamic animations
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── index.html
│   └── package.json              # Frontend packages
├── render.yaml                   # Production Render blueprints
├── .gitignore
├── .env.example                  # Environment configuration keys template
└── README.md                     # Documentation
```

---

## ⚙️ Local Development Setup

### Prerequisite Checklist
1. **Python 3.10+** installed.
2. **Node.js 18+** installed.
3. Access to **Google AI Studio** (for Gemini API) and **Twilio Console** (Optional: Local Mock Mode active by default if variables are left unconfigured!).

---

### Step 1: Backend Setup
1. Open your terminal inside `backend/` directory:
   ```bash
   cd backend
   ```
2. Set up a Python virtual environment and activate it:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Create your `.env` configuration file inside the backend directory `backend/` matching `.env.example`:
   ```env
   DATABASE_URL=sqlite:///./personalos.db
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_WHATSAPP_FROM=+14155238886
   GEMINI_API_KEY=your_gemini_key
   ```
5. Boot up the local FastAPI web server:
   ```bash
   uvicorn app.main:app --reload
   ```
   FastAPI will dynamically run migrations, seed empty logs, and start APScheduler. Documentations are available at `http://localhost:8000/docs`.

---

### Step 2: Frontend Setup
1. Open a new terminal inside the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Boot up the Vite React server:
   ```bash
   npm run dev
   ```
4. Access the premium PersonalOS application at `http://localhost:5173`.

---

### Step 3: Run Core Validation Tests
To verify CRUD operations, schema validation, and fallback logic without loading Meta keys:
```bash
cd backend
python test_backend.py
```

---

## 💬 Setting up Twilio WhatsApp Sandbox (Free Tier)

To link WhatsApp reminders with your phone number, follow this step-by-step developer integration:

### 1. Register a Twilio Account
1. Go to [Twilio Sandbox Tryout Portal](https://www.twilio.com/try-twilio) and register.
2. Verify your email and phone number.
3. When prompted about what you are building, choose **SMS/WhatsApp**.

### 2. Enable Twilio WhatsApp Sandbox
1. Go to your **Twilio Console** ➔ **Messaging** ➔ **Try it out** ➔ **Send a WhatsApp message**.
2. Note your sandbox WhatsApp phone number (usually `+14155238886`) and the sandbox join message (e.g. `join xxxxx-xxxxx`).
3. Send the sandbox join message to the sandbox phone number from your WhatsApp account to enable receiving messages.

### 3. Add Settings to your `.env`
1. Under your **Twilio Dashboard** home page:
   - Copy your **Account SID** and set it as `TWILIO_ACCOUNT_SID`.
   - Copy your **Auth Token** and set it as `TWILIO_AUTH_TOKEN`.
   - Copy the sandbox number and set it as `TWILIO_WHATSAPP_FROM`.

---

## 🧠 Getting a Gemini API Key (Free tier)
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API key** and create a key in a new or existing project.
3. Copy the generated API key and put it into `GEMINI_API_KEY` in `.env`.
> [!TIP]
> If `GEMINI_API_KEY` is not present, PersonalOS will smoothly fall back to locally compiled mock schedules and direct coach templates so you can continue testing local pages with zero friction.

---

## ☁️ Production Deployment (Render)

PersonalOS is configured for double-host cloud deployment via [Render](https://render.com/).

1. Create a free account on **Render**.
2. Click **New** ➔ Select **Blueprints**.
3. Link your PersonalOS Git repository.
4. Render will parse `render.yaml` and configure:
   - A dedicated **PostgreSQL Database Instance**.
   - A **FastAPI Python Web Service** executing backend migrations and scheduler loops.
   - A **React Static Site** serving the frontend workspace.
5. In the Render Backend service settings, copy the backend Web URL and bind it into the Frontend Static Service as an Environment Variable: `VITE_API_URL`.
