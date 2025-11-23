import React, { useState } from 'react';
import { WorkDayConfig, Holiday, DateRange, RegionAdapter } from '../types';
import { format } from 'date-fns';
import { Settings, Plus, Trash2, Globe, X, Check } from 'lucide-react';

interface SettingsPanelProps {
  config: WorkDayConfig;
  setConfig: React.Dispatch<React.SetStateAction<WorkDayConfig>>;
  adapter: RegionAdapter;
  currentYear: number;
  onClose?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, setConfig, adapter, currentYear, onClose }) => {
  const [newLeaveStart, setNewLeaveStart] = useState('');
  const [newLeaveEnd, setNewLeaveEnd] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');

  const weekDaysMap = [
    { id: 1, label: 'Ma' },
    { id: 2, label: 'Di' },
    { id: 3, label: 'Wo' },
    { id: 4, label: 'Do' },
    { id: 5, label: 'Vr' },
    { id: 6, label: 'Za' },
    { id: 0, label: 'Zo' },
  ];

  const toggleDay = (day: number) => {
    setConfig(prev => {
      if (prev.weekdays.includes(day)) {
        return { ...prev, weekdays: prev.weekdays.filter(d => d !== day) };
      } else {
        return { ...prev, weekdays: [...prev.weekdays, day] };
      }
    });
  };

  const addExcludedRange = () => {
    if (!newLeaveStart || !newLeaveEnd) return;
    const newRange: DateRange = {
      id: Math.random().toString(36).substr(2, 9),
      start: newLeaveStart,
      end: newLeaveEnd,
      label: 'Gepland Verlof',
      type: 'leave'
    };
    setConfig(prev => ({ ...prev, excludedRanges: [...prev.excludedRanges, newRange] }));
    setNewLeaveStart('');
    setNewLeaveEnd('');
  };

  const removeExcludedRange = (id: string) => {
    setConfig(prev => ({ ...prev, excludedRanges: prev.excludedRanges.filter(r => r.id !== id) }));
  };

  const addCustomHoliday = () => {
    if(!newHolidayDate || !newHolidayName) return;
    const newHoliday: Holiday = {
        date: newHolidayDate,
        name: newHolidayName,
        type: 'company'
    };
    setConfig(prev => ({...prev, customHolidays: [...prev.customHolidays, newHoliday]}));
    setNewHolidayDate('');
    setNewHolidayName('');
  }

  const removeCustomHoliday = (date: string) => {
      setConfig(prev => ({...prev, customHolidays: prev.customHolidays.filter(h => h.date !== date)}));
  }

  const togglePublicHoliday = (dateStr: string) => {
    setConfig(prev => {
      const isDisabled = prev.disabledHolidayDates.includes(dateStr);
      if (isDisabled) {
        // Enable it (remove from disabled list)
        return { ...prev, disabledHolidayDates: prev.disabledHolidayDates.filter(d => d !== dateStr) };
      } else {
        // Disable it (add to disabled list)
        return { ...prev, disabledHolidayDates: [...prev.disabledHolidayDates, dateStr] };
      }
    });
  };

  // Get preview of public holidays for current context
  const publicHolidays = adapter.getPublicHolidays(currentYear);

  const formatDate = (dateStr: string, fmt: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return format(new Date(y, m - 1, d), fmt);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-800">Instellingen</h2>
        </div>
        {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full md:hidden">
                <X className="w-5 h-5 text-slate-500" />
            </button>
        )}
      </div>

      <div className="p-4 space-y-8 overflow-y-auto custom-scrollbar flex-1 pb-20 md:pb-4">
        
        {/* Weekday Selection */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Werkdagen</h3>
          <div className="flex flex-wrap gap-2">
            {weekDaysMap.map(day => (
              <button
                key={day.id}
                onClick={() => toggleDay(day.id)}
                className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  config.weekdays.includes(day.id)
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </section>

        {/* Public Holidays */}
        <section>
          <div className="flex items-center justify-between mb-3">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Feestdagen</h3>
             <button 
                onClick={() => setConfig(prev => ({...prev, ignorePublicHolidays: !prev.ignorePublicHolidays}))}
                className="text-xs text-indigo-600 font-medium hover:underline"
             >
                {config.ignorePublicHolidays ? "Alles Inschakelen" : "Alles Uitschakelen"}
             </button>
          </div>
          
          <div className={`space-y-2 max-h-60 overflow-y-auto pr-1 ${config.ignorePublicHolidays ? 'opacity-50 pointer-events-none' : ''}`}>
             <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Globe className="w-3 h-3" /> {adapter.name} ({currentYear})
             </div>
             {publicHolidays.map((h) => {
                 const isEnabled = !config.disabledHolidayDates.includes(h.date);
                 return (
                    <label key={h.date} className="flex items-center gap-3 p-2 bg-slate-50 rounded border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isEnabled ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                            <input 
                                type="checkbox" 
                                className="hidden"
                                checked={isEnabled}
                                onChange={() => togglePublicHoliday(h.date)}
                            />
                            {isEnabled && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1">
                            <div className={`text-sm ${isEnabled ? 'text-slate-700' : 'text-slate-400 line-through'}`}>{h.name}</div>
                            <div className="text-xs text-slate-400 font-mono">{formatDate(h.date, 'dd/MM')}</div>
                        </div>
                    </label>
                 );
             })}
          </div>
        </section>

        {/* Custom Company Holidays */}
        <section>
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Extra Verlof</h3>
             <div className="space-y-2 mb-3">
                {config.customHolidays.map(h => (
                    <div key={h.date} className="flex items-center justify-between bg-purple-50 border border-purple-100 p-2 rounded text-sm">
                        <div className="flex flex-col">
                            <span className="font-medium text-purple-900">{h.name}</span>
                            <span className="text-xs text-purple-600">{formatDate(h.date, 'dd/MM/yyyy')}</span>
                        </div>
                        <button onClick={() => removeCustomHoliday(h.date)} className="text-purple-400 hover:text-purple-700">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
             </div>
             <div className="grid grid-cols-1 gap-2">
                 <input 
                    type="text" 
                    placeholder="Naam (bv. Teambuilding)" 
                    className="text-sm border border-slate-300 rounded px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={newHolidayName}
                    onChange={(e) => setNewHolidayName(e.target.value)}
                 />
                 <div className="flex gap-2">
                    <input 
                        type="date" 
                        className="text-sm border border-slate-300 rounded px-2 py-1.5 flex-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={newHolidayDate}
                        onChange={(e) => setNewHolidayDate(e.target.value)}
                    />
                    <button 
                        onClick={addCustomHoliday}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded flex items-center justify-center w-10"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                 </div>
             </div>
        </section>

        {/* Excluded Periods (Leaves, Shutdowns) */}
        <section>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Verlof & Sluitingsdagen</h3>
          
          <div className="space-y-2 mb-3">
            {config.excludedRanges.map(range => (
              <div key={range.id} className="flex items-center justify-between bg-orange-50 border border-orange-100 p-2 rounded text-sm">
                <div className="flex flex-col">
                  <span className="font-medium text-orange-900">{range.label}</span>
                  <span className="text-xs text-orange-600">
                    {formatDate(range.start, 'dd/MM')} - {formatDate(range.end, 'dd/MM')}
                  </span>
                </div>
                <button onClick={() => removeExcludedRange(range.id)} className="text-orange-400 hover:text-orange-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-center">
                <div className="flex-1">
                    <label className="text-xs text-slate-400 block mb-1">Van</label>
                    <input 
                    type="date" 
                    value={newLeaveStart}
                    onChange={(e) => setNewLeaveStart(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                    />
                </div>
                <div className="flex-1">
                    <label className="text-xs text-slate-400 block mb-1">Tot</label>
                    <input 
                    type="date" 
                    value={newLeaveEnd}
                    onChange={(e) => setNewLeaveEnd(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                    />
                </div>
            </div>
            <button 
              onClick={addExcludedRange}
              disabled={!newLeaveStart || !newLeaveEnd}
              className="w-full mt-1 bg-white border border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 py-2 rounded text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> Periode Toevoegen
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};