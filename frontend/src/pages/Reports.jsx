import React, { useState, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Award, Flame, RefreshCw, BarChart2, AlertCircle } from 'lucide-react';
import api from '../api';
import Heatmap from '../components/Heatmap';

export default function Reports() {
  // Get current YYYY-MM
  const getTodayYearMonth = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  const [currentMonth, setCurrentMonth] = useState(getTodayYearMonth());
  const [dailyStats, setDailyStats] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const [dailyRes, monthlyRes] = await Promise.all([
        api.get('/reports/daily'),
        api.get(`/reports/monthly?month=${currentMonth}`)
      ]);
      setDailyStats(dailyRes.data);
      setMonthlyStats(monthlyRes.data);
    } catch (err) {
      console.error("Error fetching reports data: ", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [currentMonth]);

  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split("-").map(Number);
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth === 0) {
      newMonth = 12;
      newYear -= 1;
    }
    setCurrentMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split("-").map(Number);
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth === 13) {
      newMonth = 1;
      newYear += 1;
    }
    setCurrentMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white font-sans">
            Analytics & Reports Dashboard
          </h2>
          <p className="text-slate-400 font-medium mt-1">
            Observe habit streaks, monthly heatmap calendar frequencies, and performance metrics.
          </p>
        </div>

        <button 
          onClick={fetchReportsData}
          className="self-start md:self-auto p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition-all"
        >
          <RefreshCw size={18} />
        </button>
      </header>

      {/* Monthly Navigator */}
      <div className="flex items-center gap-3 bg-slate-900/50 p-2 border border-slate-800/80 rounded-2xl w-fit">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-bold font-mono text-slate-300 px-4 min-w-[90px] text-center">
          {currentMonth}
        </span>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
          <RefreshCw size={32} className="text-indigo-500 animate-spin" />
          <p className="text-slate-400 font-semibold text-sm">Processing habits heatmap database...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Grid: Heatmap Calendar */}
          <div className="lg:col-span-2 space-y-6">
            <Heatmap 
              heatmapData={monthlyStats?.heatmap || {}} 
              yearMonth={currentMonth} 
            />
          </div>

          {/* Right Grid: Stats & Streaks Summaries */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <BarChart2 size={18} className="text-indigo-400" />
              Monthly Summary Stats
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {/* Completed Count */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <Award size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Completed</span>
                  <span className="text-2xl font-black text-white mt-0.5 block font-mono">
                    {monthlyStats?.total_completed || 0}
                  </span>
                  <span className="text-xs text-slate-400">Goals ticked off</span>
                </div>
              </div>

              {/* Best Month Streak */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                  <Flame size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Best Month Streak</span>
                  <span className="text-2xl font-black text-white mt-0.5 block font-mono">
                    {monthlyStats?.best_streak || 0} {monthlyStats?.best_streak === 1 ? 'day' : 'days'}
                  </span>
                  <span className="text-xs text-slate-400">Consecutive perfect days</span>
                </div>
              </div>

              {/* Toughest/Most Failed Category */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
                <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Toughest Hurdle</span>
                  <span className="text-xl font-extrabold text-white mt-0.5 block uppercase tracking-wide">
                    {monthlyStats?.most_failed_category || 'None'}
                  </span>
                  <span className="text-xs text-slate-400">Most missed goal category</span>
                </div>
              </div>
            </div>

            {/* Daily report block quick reflection */}
            {dailyStats && (
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/30">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Quick Summary</h4>
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-850">
                    <span className="block text-xs font-bold text-slate-500 uppercase">Goals</span>
                    <span className="block text-lg font-bold font-mono text-slate-200 mt-1">{dailyStats.total_tasks}</span>
                  </div>
                  <div className="bg-emerald-950/10 p-2.5 rounded-xl border border-emerald-900/10">
                    <span className="block text-xs font-bold text-emerald-500 uppercase">Done</span>
                    <span className="block text-lg font-bold font-mono text-emerald-400 mt-1">{dailyStats.completed_tasks}</span>
                  </div>
                  <div className="bg-rose-950/10 p-2.5 rounded-xl border border-rose-900/10">
                    <span className="block text-xs font-bold text-rose-500 uppercase">Missed</span>
                    <span className="block text-lg font-bold font-mono text-rose-400 mt-1">{dailyStats.failed_tasks}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
