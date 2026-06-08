import React, { useState, useEffect } from 'react';
import { Calendar, GraduationCap, Clock, Sparkles, BookOpen, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import api from '../api';

export default function StudyPlanner() {
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [lessons, setLessons] = useState('');
  const [dailyMinutes, setDailyMinutes] = useState(120);

  const [loading, setLoading] = useState(false);
  const [activePlan, setActivePlan] = useState(null);
  const [successInjected, setSuccessInjected] = useState(false);

  // Load the latest plan if exists
  const loadLatestPlan = async () => {
    try {
      const res = await api.get('/study-plan/latest');
      setActivePlan(res.data);
    } catch (err) {
      console.log("No previous study plan found.");
    }
  };

  useEffect(() => {
    loadLatestPlan();
  }, []);

  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    if (!examName.trim() || !examDate || !lessons.trim()) return;

    try {
      setLoading(true);
      setSuccessInjected(false);
      
      const payload = {
        exam_name: examName.trim(),
        exam_date: examDate,
        lessons: lessons.split(',').map(l => l.trim()).filter(l => l.length > 0),
        daily_minutes: parseInt(dailyMinutes)
      };

      const res = await api.post('/study-plan', payload);
      setActivePlan(res.data);
      setSuccessInjected(true);
      
      // Reset form
      setExamName('');
      setExamDate('');
      setLessons('');
    } catch (err) {
      console.error(err);
      alert('Failed to generate study plan. Make sure exam date is in the future.');
    } finally {
      setLoading(false);
    }
  };

  const parseLessonsList = (les) => {
    if (!les) return [];
    if (typeof les === 'string') return JSON.parse(les);
    return les;
  };

  const scheduleList = activePlan?.generated_schedule ? 
    (typeof activePlan.generated_schedule === 'string' ? JSON.parse(activePlan.generated_schedule) : activePlan.generated_schedule) 
    : [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <header>
        <h2 className="text-3xl font-extrabold tracking-tight text-white font-sans">
          Study & Exam Timetable Planner
        </h2>
        <p className="text-slate-400 font-medium mt-1">
          Input exam files to trigger deep AI split schedules that automatically inject daily study habits with WhatsApp alerts.
        </p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Form: Exam Details */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-glow sticky top-8">
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-6">
              <GraduationCap size={20} className="text-indigo-400" />
              Plan New Curriculum
            </h3>

            <form onSubmit={handleGeneratePlan} className="space-y-5">
              {/* Exam Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Exam / Goal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Solutions Architect / GMAT"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 transition-all"
                />
              </div>

              {/* Exam Date */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Exam Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all font-mono"
                />
              </div>

              {/* Comma-separated lessons */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Chapters / Lessons</label>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g. VPC Networking, S3 & IAM, Database Engines, High Availability (comma separated)"
                  value={lessons}
                  onChange={(e) => setLessons(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 transition-all resize-none font-sans"
                />
              </div>

              {/* Daily study budget */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Daily Study Minutes</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="15"
                    value={dailyMinutes}
                    onChange={(e) => setDailyMinutes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all font-mono"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">Mins</span>
                </div>
              </div>

              {/* Generate Trigger */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-glow hover:shadow-indigo-500/20 active:scale-98 transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={16} />
                {loading ? 'AI Blueprinting Plan...' : 'Generate AI Study Plan'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Content: Generated Timetable Map */}
        <div className="lg:col-span-2 space-y-6">
          {successInjected && (
            <div className="glass-panel p-5 rounded-3xl border border-emerald-500/30 bg-emerald-950/10 text-emerald-400 flex items-start gap-3 shadow-glow animate-bounce-slow">
              <CheckCircle2 size={24} className="shrink-0 text-emerald-400" />
              <div>
                <h4 className="font-bold text-slate-200">Study Roadmap generated successfully!</h4>
                <p className="text-xs text-emerald-400/90 mt-1">
                  Each session topic has been successfully scheduled and auto-injected into your active task list at daily study times (17:00–19:00). WhatsApp alarms are active!
                </p>
              </div>
            </div>
          )}

          {activePlan ? (
            <div className="space-y-6">
              {/* Exam Info Card */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-glow relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">Active Exam Track</span>
                  <h3 className="text-2xl font-black text-white mt-1 font-sans">{activePlan.exam_name}</h3>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 font-semibold">
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar size={13} />
                      Target: {activePlan.exam_date}
                    </span>
                    <span className="text-slate-700">•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      {activePlan.daily_minutes} mins daily budget
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 items-start md:items-end shrink-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Chapters Covered</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {parseLessonsList(activePlan.lessons).map((lesson, idx) => (
                      <span key={idx} className="bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-[10px] font-bold text-slate-300">
                        {lesson}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Vertical Timelined Sessions */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <BookOpen size={18} className="text-indigo-400" />
                  Day-by-Day Study Schedule
                </h4>

                <div className="relative pl-6 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
                  {scheduleList.map((session, index) => (
                    <div key={index} className="relative group">
                      {/* Circle dot timeline node */}
                      <div className="absolute left-[-21px] top-1.5 w-3 h-3 rounded-full border-2 border-slate-700 bg-brand-dark group-hover:border-indigo-500 transition-colors z-10"></div>
                      
                      <div className="glass-panel p-4 rounded-2xl border border-slate-800 hover-lift hover:border-slate-700/80 shadow-cardGlow flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold font-mono text-indigo-400/90 tracking-wide uppercase">
                            Day {index + 1} — {session.date}
                          </span>
                          <h5 className="font-bold text-slate-100 text-sm mt-0.5">
                            {session.topic}
                          </h5>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono font-bold shrink-0 self-end sm:self-center bg-slate-900/60 border border-slate-800/80 px-2.5 py-1 rounded-lg">
                          <Clock size={12} className="text-slate-500" />
                          {session.duration_minutes} Mins
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800 text-slate-500 flex flex-col items-center gap-4">
              <AlertCircle size={40} className="text-slate-600" />
              <div>
                <h4 className="font-bold text-slate-300">No active Study Roadmap set</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Fill in the curriculum details on the left, and let Claude build a comprehensive study calendar for you.
                </p>
              </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
