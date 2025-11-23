export type CalculationMode = 'date-range' | 'add-days' | 'subtract-days';

export interface Holiday {
  date: string; // ISO YYYY-MM-DD
  name: string;
  type: 'public' | 'custom' | 'regional' | 'company';
}

export interface DateRange {
  id: string;
  start: string;
  end: string;
  label: string;
  type: 'leave' | 'shutdown' | 'sick';
}

export interface WorkDayConfig {
  weekdays: number[]; // 0 = Sunday, 1 = Monday, etc.
  ignorePublicHolidays: boolean;
  disabledHolidayDates: string[]; // Dates of public holidays to ignore
  customHolidays: Holiday[];
  excludedRanges: DateRange[];
}

export interface CalculationResult {
  totalWorkingDays: number;
  endDate?: string; // For add-days mode
  startDate?: string; // For subtract-days mode
  calendarData: DayStatus[];
  holidayCount: number;
  weekendCount: number;
  excludedCount: number;
}

export interface DayStatus {
  date: string;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isExcluded: boolean;
  exclusionName?: string;
  isWorkDay: boolean;
}

// Adapter Interface for Region Scalability
export interface RegionAdapter {
  id: string;
  name: string;
  description: string;
  getPublicHolidays(year: number): Holiday[];
  getDefaultWeekdays(): number[];
}
