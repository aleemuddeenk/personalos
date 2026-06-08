import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Flame, AlertCircle, RefreshCw, Smartphone } from 'lucide-react';
import api from '../api';
import TaskItem from '../components/TaskItem';

export default function Home() {
  const [logs, setLogs] = useState([]);
  const [report, setReport] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch today's logs, daily stats and settings in parallel
      const [logsRes, reportRes, settingsRes] = await Promise.all([
        api.get('/logs/today'),
        api.get('/reports/daily'),
        api.get('/settings'),
      ]);
      
      setLogs(logsRes.data);
      setReport(reportRes.data);
      setSettings(settingsRes.data);
    } catch (err) {
      console.error(err);
      setError('Could not load dashboard data. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCompleteTask = async (logId) => {
    try {
      await api.post(`/logs/${logId}/complete`);
      // Re-fetch data to update percentages and streak
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error updating task. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw size={36} className="text-indigo-500 animate-spin" />
        <p className="text-slate-400 font-semibold">Aligning your PersonalOS dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-6 rounded-3xl border border-rose-500/20 bg-rose-950/5 flex flex-col items-center gap-4 text-center">
        <AlertCircle size={48} className="text-rose-500" />
        <div>
          <h3 className="text-lg font-bold text-slate-200">Database Connection Warning</h3>
          <p className="text-sm text-slate-400 mt-1">{error}</p>
        </div>
        <button
          onClick={fetchData}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl transition"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const completionRate = report?.completion_rate || 0.0;
  const streak = report?.streak || 0;
  const totalTasks = report?.total_tasks || 0;
  const completedTasks = report?.completed_tasks || 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Welcome */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white font-sans">
            Hey, {settings?.user_name || 'Champion'}!
          </h2>
          <p className="text-slate-400 font-medium mt-1">
            {totalTasks > 0 
              ? `You have completed ${completedTasks}/${totalTasks} of today's targets.` 
              : "No tasks scheduled for today. Head to 'Recurring Tasks' to add some!"}
          </p>
        </div>
        
        {/* Refresh trigger */}
        <button 
          onClick={fetchData}
          className="self-start md:self-auto p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition-all"
          title="Refresh statistics"
        >
          <RefreshCw size={18} />
        </button>
      </header>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progress Ring Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex items-center justify-between shadow-glow relative overflow-hidden">
          <div className="z-10">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Today's Focus</span>
            <span className="text-3xl font-black text-white mt-1 block font-mono">{completionRate.toFixed(0)}%</span>
            <span className="text-xs font-semibold text-indigo-400 mt-2 flex items-center gap-1">
              <TrendingUp size={14} />
              Goal completion pace
            </span>
          </div>

          {/* SVG Progress Circle */}
          <div className="relative w-20 h-20 shrink-0 z-10">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-indigo-500 transition-all duration-500 ease-out"
                strokeDasharray={`${completionRate}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-extrabold font-mono text-slate-300">
              {completedTasks}/{totalTasks}
            </div>
          </div>
        </div>

        {/* Perfect Streak Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex items-center justify-between shadow-glow overflow-hidden relative">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Perfect Streak</span>
            <span className="text-3xl font-black text-white mt-1 block font-mono">{streak} {streak === 1 ? 'Day' : 'Days'}</span>
            <span className="text-xs font-semibold text-amber-500 mt-2 flex items-center gap-1">
              <Flame size={14} className={streak > 0 ? 'animate-bounce text-amber-400' : ''} />
              Conforming consecutive days
            </span>
          </div>
          <div className="p-4 bg-amber-500/10 text-amber-400 rounded-2xl shadow-inner shrink-0">
            <Flame size={28} className={streak > 0 ? 'text-amber-500 fill-amber-500' : 'text-slate-600'} />
          </div>
        </div>

        {/* WhatsApp Notification Indicator Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex items-center justify-between shadow-glow overflow-hidden relative">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">WhatsApp Agent</span>
            <span className="text-base font-extrabold text-white mt-2 block overflow-hidden text-ellipsis whitespace-nowrap">
              {settings?.whatsapp_number ? `+${settings.whatsapp_number}` : 'Unconfigured'}
            </span>
            <span className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Reminders fully live
            </span>
          </div>
          <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl shrink-0">
            <Smartphone size={28} />
          </div>
        </div>
      </div>

      {/* Claude AI Morning Coaching message */}
      {report?.motivational_message && (
        <div className="glass-panel p-6 rounded-3xl border border-indigo-500/20 bg-indigo-950/5 relative shadow-glow">
          <div className="absolute top-4 right-4 bg-indigo-500/10 p-1.5 rounded-lg text-indigo-400">
            <Sparkles size={16} />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Sparkles size={14} className="animate-spin-slow" />
            AI Habit Coach Reflection
          </h3>
          <p className="mt-2 text-slate-200 text-sm leading-relaxed font-medium italic">
            "{report.motivational_message}"
          </p>
        </div>
      )}

      {/* Today's Tasks List */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
          Scheduled Due Today
        </h3>

        {logs.length === 0 ? (
          <div className="glass-panel p-8 text-center rounded-3xl border border-slate-800 text-slate-500">
            <AlertCircle className="mx-auto text-slate-600 mb-3" size={32} />
            <p className="text-sm font-semibold">No active tasks today.</p>
            <p className="text-xs text-slate-500 mt-1">Create dynamic tasks under the 'Recurring Tasks' page.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {logs.map((log) => (
              <TaskItem key={log.id} log={log} onComplete={handleCompleteTask} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
