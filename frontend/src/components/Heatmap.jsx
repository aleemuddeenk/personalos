import React from 'react';

export default function Heatmap({ heatmapData, yearMonth }) {
  // Parse year and month
  const [yearStr, monthStr] = (yearMonth || "").split("-");
  const year = parseInt(yearStr) || new Date().getFullYear();
  const month = parseInt(monthStr) || (new Date().getMonth() + 1);

  // Get total days in month & starting day of the week
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const totalDays = new Date(year, month, 0).getDate();

  // Create list of days
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  
  // Create blank prefixes to align the grid correctly like a real wall calendar
  const blankPrefixes = Array.from({ length: startDayOfWeek }, (_, i) => i);

  // Month names list
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getHeatmapColor = (day) => {
    // Format date string to match key: YYYY-MM-DD
    const dayStr = String(day).padStart(2, '0');
    const fullDate = `${year}-${String(month).padStart(2, '0')}-${dayStr}`;
    const rate = heatmapData[fullDate];

    if (rate === undefined) {
      // Gray: No tasks scheduled on this day
      return 'bg-slate-800 text-slate-500 border-slate-700/30';
    }
    if (rate >= 100) {
      // Full success: vibrant green
      return 'bg-emerald-500 text-brand-dark font-extrabold border-emerald-400 shadow-successGlow';
    }
    if (rate >= 50) {
      // Moderate success: amber yellow
      return 'bg-amber-500/80 text-brand-dark font-extrabold border-amber-400';
    }
    // Failed or very low completion rate: rose red
    return 'bg-rose-500 text-white font-semibold border-rose-400';
  };

  const getTooltip = (day) => {
    const dayStr = String(day).padStart(2, '0');
    const fullDate = `${year}-${String(month).padStart(2, '0')}-${dayStr}`;
    const rate = heatmapData[fullDate];

    if (rate === undefined) {
      return "No tasks scheduled";
    }
    return `Completion rate: ${rate}%`;
  };

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold font-sans text-slate-200">
          {monthNames[month - 1]} {year}
        </h3>
        {/* Heatmap Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700/50"></span>
            <span>No Tasks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500"></span>
            <span>Failed (&lt;50%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/80"></span>
            <span>Partial (&ge;50%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500"></span>
            <span>100% Success</span>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 shadow-glow">
        {/* Calendar Grid Header */}
        <div className="grid grid-cols-7 gap-2 mb-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
          {daysOfWeek.map((day) => (
            <div key={day} className="py-1">{day}</div>
          ))}
        </div>

        {/* Calendar Squares Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Blank start alignments */}
          {blankPrefixes.map((idx) => (
            <div key={`blank-${idx}`} className="aspect-square bg-slate-900/20 rounded-xl border border-transparent"></div>
          ))}

          {/* Days squares */}
          {daysArray.map((day) => {
            const colorClass = getHeatmapColor(day);
            const tooltip = getTooltip(day);
            return (
              <div
                key={day}
                title={tooltip}
                className={`aspect-square hover-lift border rounded-xl flex items-center justify-center text-xs font-mono transition-all duration-200 cursor-pointer relative group ${colorClass}`}
              >
                <span>{day}</span>
                
                {/* Micro Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-brand-dark border border-slate-700 text-slate-300 text-[10px] font-bold py-1 px-2.5 rounded-lg whitespace-nowrap z-20 shadow-xl pointer-events-none">
                  {tooltip}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
