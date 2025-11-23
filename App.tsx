import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { Briefcase, CalendarDays, Calculator, ChevronRight, Info, Settings as SettingsIcon, MapPin } from 'lucide-react';

import { belgiumFlandersAdapter } from './services/adapters/belgiumFlandersAdapter';
import { belgiumWalloniaAdapter } from './services/adapters/belgiumWalloniaAdapter';
import { belgiumBrusselsAdapter } from './services/adapters/belgiumBrusselsAdapter';
import { netherlandsAdapter } from './services/adapters/netherlandsAdapter';

import { calculateWorkingDays } from './services/calculatorService';
import { SettingsPanel } from './components/SettingsPanel';
import { CalendarVisualizer } from './components/CalendarVisualizer';
import { WorkDayConfig, CalculationMode, CalculationResult, RegionAdapter } from './types';

const App: React.FC = () => {
  // --- Adapters ---
  const adapters: RegionAdapter[] = [
    belgiumFlandersAdapter,
    belgiumWalloniaAdapter,
    belgiumBrusselsAdapter,
    netherlandsAdapter
  ];

  // --- State ---

  // Region Selection
  const [selectedAdapterId, setSelectedAdapterId] = useState<string>(adapters[0].id);

  // Basic Inputs
  const [mode, setMode] = useState<CalculationMode>('date-range');
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(addDays(new Date(), 7), 'yyyy-MM-dd')); // Used for 'date-range'
  const [daysToAdd, setDaysToAdd] = useState<string>('5'); // Used for 'add-days'/'subtract-days'
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);

  // Advanced Config
  const [config, setConfig] = useState<WorkDayConfig>({
    weekdays: adapters[0].getDefaultWeekdays(), // Initialize with first adapter defaults
    ignorePublicHolidays: false,
    disabledHolidayDates: [],
    customHolidays: [],
    excludedRanges: []
  });

  // Results
  const [result, setResult] = useState<CalculationResult | null>(null);

  // Computed
  const currentAdapter = useMemo(() => adapters.find(a => a.id === selectedAdapterId) || adapters[0], [selectedAdapterId]);
  const currentYear = useMemo(() => new Date(startDate).getFullYear(), [startDate]);

  // --- Effects ---

  // Update default weekdays when adapter changes (optional, but good UX if defaults differ)
  useEffect(() => {
    // Only reset if the user hasn't made custom changes? 
    // For simplicity in this version, we won't forcibly overwrite complex user edits, 
    // but ensuring defaults match the region is usually desired on switch.
    // However, to avoid losing state, let's keep user config unless they hit a reset.
  }, [selectedAdapterId]);

  // Recalculate whenever inputs change
  useEffect(() => {
    const targetValue = mode === 'date-range' ? endDate : daysToAdd;

    // Basic validation
    if (!startDate) return;
    if (mode === 'date-range' && !endDate) return;
    if (mode !== 'date-range' && !daysToAdd) return;

    const res = calculateWorkingDays(
      currentAdapter,
      mode,
      startDate,
      targetValue,
      config
    );
    setResult(res);
  }, [mode, startDate, endDate, daysToAdd, config, currentAdapter]);

  // --- Handlers ---

  // Helper for Dutch date formatting
  const formatDateDutch = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dObj = new Date(y, m - 1, d);

    const day = format(dObj, 'd');
    const monthNames = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
    const month = monthNames[dObj.getMonth()];
    const year = dObj.getFullYear();
    const dayNames = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
    const dayName = dayNames[dObj.getDay()];
    return `${dayName}, ${day} ${month} ${year}`;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">

      {/* SIDEBAR / SETTINGS (Desktop) */}
      <aside className="hidden md:block w-80 lg:w-96 flex-shrink-0 p-4 h-screen sticky top-0 z-20 overflow-hidden">
        <SettingsPanel
          config={config}
          setConfig={setConfig}
          adapter={currentAdapter}
          currentYear={currentYear}
        />
      </aside>

      {/* MOBILE SETTINGS DRAWER */}
      {isMobileSettingsOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-200">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileSettingsOpen(false)} />
          <div className="relative z-10 bg-white h-[90vh] mt-auto rounded-t-2xl shadow-2xl overflow-hidden flex flex-col">
            <SettingsPanel
              config={config}
              setConfig={setConfig}
              adapter={currentAdapter}
              currentYear={currentYear}
              onClose={() => setIsMobileSettingsOpen(false)}
            />
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <Calculator className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">WorkDay Pro</h1>
            </div>
            <p className="text-sm md:text-base text-slate-500 max-w-2xl">
              De ultieme werkdagcalculator voor de Benelux.
            </p>
          </div>

          {/* Region Selector */}
          <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 max-w-xs">
            <div className="pl-2 text-slate-400">
              <MapPin className="w-4 h-4" />
            </div>
            <select 
              value={selectedAdapterId}
              onChange={(e) => setSelectedAdapterId(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-700 py-1.5 pr-8 pl-1 focus:outline-none cursor-pointer w-full"
            >
              {adapters.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </header>

        {/* INPUT CARD */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">

          {/* Tabs + Config Button (Mobile) */}
          <div className="flex gap-2 mb-6">
            <div className="flex-1 flex bg-slate-100 p-1 rounded-lg overflow-x-auto">
              <button
                onClick={() => setMode('date-range')}
                className={`flex-1 min-w-[80px] px-2 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${mode === 'date-range' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Periode
              </button>
              <button
                onClick={() => setMode('add-days')}
                className={`flex-1 min-w-[80px] px-2 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${mode === 'add-days' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                + Dagen
              </button>
              <button
                onClick={() => setMode('subtract-days')}
                className={`flex-1 min-w-[80px] px-2 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${mode === 'subtract-days' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                - Dagen
              </button>
            </div>

            {/* Prominent Config Button for Mobile */}
            <button
              onClick={() => setIsMobileSettingsOpen(true)}
              className="md:hidden flex items-center justify-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-lg text-indigo-700 active:bg-indigo-100"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Form Fields */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-end">
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Startdatum</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
              />
              <p className="text-[10px] text-slate-400 mt-1">* Inclusief startdag (indien werkdag)</p>
            </div>

            <div className="hidden md:flex text-slate-300 pb-3">
              <ChevronRight />
            </div>

            <div className="w-full md:w-1/3">
              {mode === 'date-range' ? (
                <>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Einddatum</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
                  />
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Aantal Werkdagen
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={daysToAdd}
                    onChange={(e) => setDaysToAdd(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* RESULTS AREA */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 animate-fade-in">

            {/* STATS */}
            <div className="space-y-4">
              <div className="bg-indigo-600 rounded-xl p-5 md:p-6 text-white shadow-lg shadow-indigo-200">
                <div className="flex items-center gap-2 text-indigo-100 mb-2">
                  <Briefcase className="w-5 h-5" />
                  <span className="font-medium text-sm uppercase tracking-wide">Werkdagen</span>
                </div>
                <div className="text-4xl md:text-5xl font-bold tracking-tight">
                  {result.totalWorkingDays}
                </div>

                {(mode === 'add-days' || mode === 'subtract-days') && (
                  <div className="mt-4 pt-4 border-t border-indigo-500/30">
                    <p className="text-indigo-100 text-sm mb-1">{mode === 'add-days' ? 'Resultaat' : 'Startdatum'}</p>
                    <p className="text-xl md:text-2xl font-semibold">
                      {mode === 'add-days' && result.endDate ? formatDateDutch(result.endDate) : ''}
                      {mode === 'subtract-days' && result.startDate ? formatDateDutch(result.startDate) : ''}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] md:text-xs text-slate-400 uppercase tracking-wider font-semibold">Weekends</span>
                  <span className="text-lg md:text-xl font-bold text-slate-700">{result.weekendCount}</span>
                </div>
                <div>
                  <span className="block text-[10px] md:text-xs text-slate-400 uppercase tracking-wider font-semibold">Feestdagen</span>
                  <span className="text-lg md:text-xl font-bold text-rose-600">{result.holidayCount}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="block text-[10px] md:text-xs text-slate-400 uppercase tracking-wider font-semibold">Verlof/Anders</span>
                    <span className="text-lg md:text-xl font-bold text-orange-600">{result.excludedCount}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 text-blue-800 text-xs md:text-sm p-4 rounded-lg flex gap-3 border border-blue-100">
                <Info className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Geselecteerd: {currentAdapter.name}</p>
                  <p className="opacity-90">{currentAdapter.description}</p>
                </div>
              </div>
            </div>

            {/* VISUALIZER */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-5 h-5 text-slate-400" />
                <h3 className="text-lg font-semibold text-slate-800">Tijdlijn</h3>
              </div>
              <CalendarVisualizer data={result.calendarData} startDateStr={startDate} />
            </div>

          </div>
        )}

      </main>
    </div>
  );
}

export default App;