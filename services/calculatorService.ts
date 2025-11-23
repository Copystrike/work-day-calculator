import { 
  addDays, 
  isSameDay, 
  getDay, 
  isWithinInterval, 
  differenceInCalendarDays,
  format
} from 'date-fns';
import { CalculationResult, CalculationMode, WorkDayConfig, DayStatus, RegionAdapter, Holiday } from '../types';

// Helper to parse YYYY-MM-DD strings to local Date objects at 00:00:00
const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const calculateWorkingDays = (
  adapter: RegionAdapter,
  mode: CalculationMode,
  startDateStr: string,
  targetValue: string, // Could be endDateStr or number of days
  config: WorkDayConfig
): CalculationResult => {
  
  // Use manual parse instead of startOfDay(parseISO(...))
  let current = parseDate(startDateStr);
  const calendarData: DayStatus[] = [];
  let workingDayCount = 0;
  let holidayCount = 0;
  let weekendCount = 0;
  let excludedCount = 0;
  
  // Cache holidays by year to avoid recalculating frequently
  const holidaysByYear = new Map<number, Holiday[]>();
  
  const getHolidaysForYear = (year: number) => {
    if (!holidaysByYear.has(year)) {
      holidaysByYear.set(year, adapter.getPublicHolidays(year));
    }
    return holidaysByYear.get(year) || [];
  };

  const isHoliday = (date: Date): { isHoliday: boolean, name?: string, type?: string } => {
    // Master switch still valid, but granular check comes first for UX consistency
    if (config.ignorePublicHolidays) return { isHoliday: false };

    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Check custom
    const custom = config.customHolidays.find(h => h.date === dateStr);
    if (custom) return { isHoliday: true, name: custom.name, type: custom.type };

    // Check adapter public
    const year = date.getFullYear();
    const publics = getHolidaysForYear(year);
    const pub = publics.find(h => h.date === dateStr);
    
    if (pub) {
      // Check if this specific public holiday is disabled by the user
      if (config.disabledHolidayDates && config.disabledHolidayDates.includes(dateStr)) {
        return { isHoliday: false };
      }
      return { isHoliday: true, name: pub.name, type: pub.type };
    }

    return { isHoliday: false };
  };

  const isExcluded = (date: Date): { isExcluded: boolean, label?: string } => {
    for (const range of config.excludedRanges) {
        // Fix for timezones: ensure we compare dates properly without time
        const start = parseDate(range.start);
        const end = parseDate(range.end);
        if (isWithinInterval(date, { start, end })) {
            return { isExcluded: true, label: range.label };
        }
    }
    return { isExcluded: false };
  };

  // HELPER: Analyze a single day
  const analyzeDay = (date: Date): DayStatus => {
    const dayOfWeek = getDay(date); // 0 = Sun
    const dateStr = format(date, 'yyyy-MM-dd');

    const holidayInfo = isHoliday(date);
    const exclusionInfo = isExcluded(date);
    const isWeekend = !config.weekdays.includes(dayOfWeek);

    let isWorkDay = !isWeekend && !holidayInfo.isHoliday && !exclusionInfo.isExcluded;

    return {
      date: dateStr,
      isWeekend,
      isHoliday: holidayInfo.isHoliday,
      holidayName: holidayInfo.name,
      isExcluded: exclusionInfo.isExcluded,
      exclusionName: exclusionInfo.label,
      isWorkDay
    };
  };

  // LOGIC BRANCHING BASED ON MODE

  if (mode === 'date-range') {
    const end = parseDate(targetValue);
    // Loop through dates inclusive
    // Limit to prevent infinite loops or massive calcs (e.g. max 10 years)
    const limit = 3650; 
    let daysProcessed = 0;

    // We iterate from start to end (inclusive)
    while ((current <= end) && daysProcessed < limit) {
      const status = analyzeDay(current);
      calendarData.push(status);

      if (status.isWorkDay) workingDayCount++;
      if (status.isWeekend) weekendCount++;
      if (status.isHoliday) holidayCount++;
      else if (status.isExcluded) excludedCount++; // Count excluded only if not holiday

      current = addDays(current, 1);
      daysProcessed++;
    }

    return {
      totalWorkingDays: workingDayCount,
      calendarData,
      holidayCount,
      weekendCount,
      excludedCount
    };

  } else {
    // Add or Subtract Days
    const daysToProcess = parseInt(targetValue, 10);
    const isSubtraction = mode === 'subtract-days';
    const limit = 3650; // Safety break
    let daysFound = 0;
    let safetyCounter = 0;

    // Start Date Inclusion:
    // The previous version skipped the start date (business logic: start + 1).
    // The requirement is "Start date should always be included".
    // So if start date is valid, it counts as day 1.
    // We do NOT modify 'current' initially.

    while (daysFound < daysToProcess && safetyCounter < limit) {
      const status = analyzeDay(current);
      calendarData.push(status);

      if (status.isWorkDay) {
        daysFound++;
      } else {
        if (status.isWeekend) weekendCount++;
        if (status.isHoliday) holidayCount++;
        else if (status.isExcluded) excludedCount++;
      }

      // If we haven't found enough days, move to next/prev
      if (daysFound < daysToProcess) {
        // replace subDays(current, 1) with addDays(current, -1)
        current = isSubtraction ? addDays(current, -1) : addDays(current, 1);
      }
      safetyCounter++;
    }
    
    calendarData.sort((a, b) => a.date.localeCompare(b.date));

    // For visualization: If subtraction, the "Result" is actually the *first* date in the sorted list.
    // If addition, the "Result" is the *last* date.
    const resultDate = isSubtraction ? calendarData[0].date : calendarData[calendarData.length - 1].date;

    return {
      totalWorkingDays: daysFound,
      endDate: !isSubtraction ? resultDate : undefined,
      startDate: isSubtraction ? resultDate : undefined,
      calendarData,
      holidayCount,
      weekendCount,
      excludedCount
    };
  }
};