import React from 'react';
import { DayStatus } from '../types';
import { getDay, format, endOfMonth, eachDayOfInterval } from 'date-fns';

interface CalendarVisualizerProps {
  data: DayStatus[];
  startDateStr: string;
}

export const CalendarVisualizer: React.FC<CalendarVisualizerProps> = ({ data, startDateStr }) => {
  if (!data || data.length === 0) return null;

  // Helper to parse YYYY-MM-DD
  const parseDate = (str: string) => {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // Group data by months for rendering multiple calendars
  const start = parseDate(data[0].date);
  const end = parseDate(data[data.length - 1].date);
  
  const months: { date: Date, days: Date[] }[] = [];
  // Start iteration at the 1st of the start month
  let currentIter = new Date(start.getFullYear(), start.getMonth(), 1);
  const finalEnd = endOfMonth(end);

  while (currentIter <= finalEnd) {
    // Generate dates for the current month
    const monthStart = new Date(currentIter.getFullYear(), currentIter.getMonth(), 1);
    const monthEnd = endOfMonth(currentIter);

    months.push({
      date: currentIter,
      days: eachDayOfInterval({ start: monthStart, end: monthEnd })
    });
    // Add 1 month safely
    currentIter = new Date(currentIter.getFullYear(), currentIter.getMonth() + 1, 1);
  }

  // Helper to find status
  const getStatus = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return data.find(d => d.date === dayStr);
  };

  // Helper for Dutch month names (avoiding locale import issues for now)
  const getDutchMonthName = (date: Date) => {
    const monthNames = [
        "Januari", "Februari", "Maart", "April", "Mei", "Juni",
        "Juli", "Augustus", "September", "Oktober", "November", "December"
    ];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className="space-y-8">
      {months.map((monthData, idx) => (
        <div key={idx} className="bg-white rounded-lg p-4 border border-slate-100 shadow-sm">
          <h4 className="text-lg font-semibold text-slate-800 mb-4 capitalize">
            {getDutchMonthName(monthData.date)}
          </h4>
          
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'].map(d => (
              <div key={d} className="text-xs font-bold text-slate-400 uppercase tracking-wider">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for start of month */}
            {Array.from({ length: getDay(monthData.days[0]) }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {monthData.days.map((day) => {
              const status = getStatus(day);
              // Base Styles
              let bgClass = 'bg-transparent';
              let textClass = 'text-slate-300';
              let borderClass = 'border-transparent';
              
              if (status) {
                textClass = 'text-slate-700';
                if (status.isWorkDay) {
                  bgClass = 'bg-emerald-100';
                  textClass = 'text-emerald-900 font-medium';
                } else if (status.isHoliday) {
                  bgClass = 'bg-rose-100';
                  textClass = 'text-rose-700 font-medium';
                  borderClass = 'border-rose-200';
                } else if (status.isExcluded) {
                    bgClass = 'bg-orange-100';
                    textClass = 'text-orange-800';
                    borderClass = 'border-orange-200';
                } else if (status.isWeekend) {
                  bgClass = 'bg-slate-50';
                  textClass = 'text-slate-400';
                }
              }

              return (
                <div 
                  key={day.toISOString()} 
                  className={`
                    aspect-square rounded flex flex-col items-center justify-center text-sm relative border ${borderClass} ${bgClass} ${textClass}
                    group cursor-default transition-colors
                  `}
                >
                  <span>{format(day, 'd')}</span>
                  
                  {/* Tooltip for status details */}
                  {status && !status.isWorkDay && !status.isWeekend && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[150px] bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                      {status.holidayName || status.exclusionName}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};