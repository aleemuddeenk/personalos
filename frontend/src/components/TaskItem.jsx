import React from 'react';
import { Check, X, Clock, Award, BookOpen, Dumbbell, Briefcase, Zap, HelpCircle } from 'lucide-react';

export default function TaskItem({ log, onComplete, showAction = true }) {
  const { id, status, task } = log;
  const { name, time, duration_minutes, category } = task;

  // Category styling and icon selector
  const getCategoryMeta = (cat) => {
    const defaultMeta = {
      bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      icon: HelpCircle,
      label: 'Other'
    };
    
    switch (cat?.toLowerCase()) {
      case 'study':
        return {
          bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          icon: BookOpen,
          label: 'Study'
        };
      case 'exercise':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: Dumbbell,
          label: 'Exercise'
        };
      case 'work':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: Briefcase,
          label: 'Work'
        };
      case 'habit':
        return {
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          icon: Zap,
          label: 'Habit'
        };
      default:
        return defaultMeta;
    }
  };

  const catMeta = getCategoryMeta(category);
  const CategoryIcon = catMeta.icon;

  return (
    <div className={`glass-panel p-5 rounded-2xl border hover-lift flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 ${
      status === 'completed' 
        ? 'border-emerald-500/30 bg-emerald-950/5' 
        : status === 'failed' 
          ? 'border-rose-500/20 bg-rose-950/5' 
          : 'border-slate-800 hover:border-indigo-500/50 shadow-cardGlow'
    }`}>
      {/* Task Details */}
      <div className="flex items-start gap-4">
        {/* Status Indicator Orb */}
        <div className={`mt-1 p-2 rounded-xl shrink-0 ${
          status === 'completed'
            ? 'bg-emerald-500/10 text-emerald-400'
            : status === 'failed'
              ? 'bg-rose-500/10 text-rose-400'
              : 'bg-slate-800 text-slate-500'
        }`}>
          {status === 'completed' && <Check size={18} />}
          {status === 'failed' && <X size={18} />}
          {status === 'pending' && <Clock size={18} className="animate-spin-slow" />}
        </div>

        <div>
          <h3 className={`text-base font-semibold ${status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
            {name}
          </h3>
          
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-semibold text-slate-400">
            {/* Scheduled Time */}
            <span className="flex items-center gap-1 text-slate-400 font-mono">
              <Clock size={12} />
              {time}
            </span>
            {/* Duration */}
            <span className="text-slate-600">•</span>
            <span>{duration_minutes} mins</span>
            
            {/* Category badge */}
            <span className="text-slate-600">•</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] uppercase font-bold tracking-wide ${catMeta.bg}`}>
              <CategoryIcon size={10} />
              {catMeta.label}
            </span>
          </div>
        </div>
      </div>

      {/* Manual Checkoff Trigger Action */}
      {showAction && status === 'pending' && (
        <button
          onClick={() => onComplete(id)}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-glow hover:shadow-indigo-500/20 active:scale-95 transition-all duration-200"
        >
          <Check size={14} />
          Complete Task
        </button>
      )}

      {/* Completed Text Badge */}
      {status === 'completed' && (
        <span className="text-xs font-bold text-emerald-400/90 flex items-center gap-1 py-1 px-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 self-end sm:self-center">
          <Award size={14} />
          Done
        </span>
      )}

      {/* Failed Badge */}
      {status === 'failed' && (
        <span className="text-xs font-bold text-rose-400/90 flex items-center gap-1 py-1 px-2.5 rounded-lg bg-rose-950/20 border border-rose-500/20 self-end sm:self-center">
          Failed
        </span>
      )}
    </div>
  );
}
