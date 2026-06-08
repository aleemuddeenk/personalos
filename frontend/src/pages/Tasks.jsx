import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, CalendarRange, FolderPlus, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [name, setName] = useState('');
  const [time, setTime] = useState('08:00');
  const [duration, setDuration] = useState(30);
  const [category, setCategory] = useState('Habit');
  
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      setSuccessMsg('');
      const newTask = {
        name: name.trim(),
        time,
        duration_minutes: parseInt(duration),
        category,
        is_active: true
      };

      await api.post('/tasks', newTask);
      setName('');
      setSuccessMsg('Recurring task added successfully and scheduled!');
      
      // Auto dismiss success toast
      setTimeout(() => setSuccessMsg(''), 4000);
      
      fetchTasks();
    } catch (err) {
      console.error(err);
      alert('Failed to save task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this recurring task? This will stop WhatsApp alerts for it.')) return;
    
    try {
      await api.delete(`/tasks/${taskId}`);
      fetchTasks();
    } catch (err) {
      console.error(err);
      alert('Failed to delete task.');
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'study': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'exercise': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'work': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'habit': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <header>
        <h2 className="text-3xl font-extrabold tracking-tight text-white font-sans">
          Recurring Habits & Tasks
        </h2>
        <p className="text-slate-400 font-medium mt-1">
          Define recurring daily goals that trigger automated WhatsApp notifications.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form: Add New Task */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-glow sticky top-8">
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-6">
              <FolderPlus size={18} className="text-indigo-400" />
              Add Daily Task
            </h3>

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle size={14} className="shrink-0" />
                {successMsg}
              </div>
            )}

            <form onSubmit={handleAddTask} className="space-y-5">
              {/* Task Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Morning Cardio / LeetCode"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 transition-all font-sans"
                />
              </div>

              {/* Start Time & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Alarm Time</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mins Budget</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Goal Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all font-sans cursor-pointer"
                >
                  <option value="Habit">Habit</option>
                  <option value="Study">Study</option>
                  <option value="Exercise">Exercise</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Submit Trigger */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-glow hover:shadow-indigo-500/20 active:scale-98 transition-all duration-200 mt-2 cursor-pointer disabled:opacity-50"
              >
                <Plus size={16} />
                {submitting ? 'Creating...' : 'Schedule Task'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Content: Active Recurring List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <CalendarRange size={18} className="text-indigo-400" />
            Active Scheduled Rules ({tasks.length})
          </h3>

          {loading ? (
            <div className="glass-panel p-8 text-center rounded-3xl border border-slate-800 text-slate-500">
              <span className="text-sm font-semibold animate-pulse block">Fetching recurring templates...</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="glass-panel p-8 text-center rounded-3xl border border-slate-800 text-slate-500">
              <AlertCircle className="mx-auto text-slate-600 mb-3" size={32} />
              <p className="text-sm font-semibold">No active recurring habits scheduled yet.</p>
              <p className="text-xs text-slate-500 mt-1">Configure your daily checklist rules on the left.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className="glass-panel p-5 rounded-2xl border border-slate-800 hover-lift hover:border-slate-700/80 shadow-cardGlow flex flex-col justify-between gap-4 transition-all duration-200"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-slate-100 text-base leading-snug break-words">
                        {task.name}
                      </h4>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 hover:bg-rose-500/10 rounded-lg transition"
                        title="Delete template rule"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4 text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1 bg-slate-900 border border-slate-800/80 py-1 px-2.5 rounded-lg text-[10px] uppercase font-mono">
                        <Clock size={11} />
                        {task.time}
                      </span>
                      <span className="bg-slate-900 border border-slate-800/80 py-1 px-2.5 rounded-lg text-[10px] uppercase font-mono">
                        {task.duration_minutes} Mins
                      </span>
                      <span className={`border py-1 px-2.5 rounded-lg text-[10px] uppercase ${getCategoryColor(task.category)}`}>
                        {task.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
