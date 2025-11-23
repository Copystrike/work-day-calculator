import { RegionAdapter, Holiday } from '../../types';
import { addDays, format, getDay } from 'date-fns';

export class NetherlandsAdapter implements RegionAdapter {
  id = 'NL';
  name = 'Nederland';
  description = 'Inclusief Koningsdag, Bevrijdingsdag, Tweede Paas-, Pinkster- en Kerstdag.';

  getDefaultWeekdays(): number[] {
    return [1, 2, 3, 4, 5]; // Ma-Vr
  }

  getPublicHolidays(year: number): Holiday[] {
    const holidays: Holiday[] = [];
    const fmt = (date: Date) => format(date, 'yyyy-MM-dd');

    // 1. Vaste Datums
    holidays.push({ date: `${year}-01-01`, name: "Nieuwjaarsdag", type: 'public' });
    holidays.push({ date: `${year}-05-05`, name: "Bevrijdingsdag", type: 'public' }); // Is officieel, niet altijd vrij, maar hoort in de lijst
    holidays.push({ date: `${year}-12-25`, name: "Eerste Kerstdag", type: 'public' });
    holidays.push({ date: `${year}-12-26`, name: "Tweede Kerstdag", type: 'public' });

    // Koningsdag: 27 April, tenzij het op Zondag valt, dan 26 April.
    const kingsDayDate = new Date(year, 3, 27); // Month index 3 = April
    if (getDay(kingsDayDate) === 0) {
        holidays.push({ date: `${year}-04-26`, name: "Koningsdag", type: 'public' });
    } else {
        holidays.push({ date: `${year}-04-27`, name: "Koningsdag", type: 'public' });
    }

    // 2. Variabele Datums
    const easter = this.getEasterDate(year);
    const goodFriday = addDays(easter, -2);
    const easterMonday = addDays(easter, 1);
    const ascensionDay = addDays(easter, 39);
    const whitMonday = addDays(easter, 50);

    holidays.push({ date: fmt(goodFriday), name: "Goede Vrijdag", type: 'public' });
    holidays.push({ date: fmt(easterMonday), name: "Tweede Paasdag", type: 'public' });
    holidays.push({ date: fmt(ascensionDay), name: "Hemelvaartsdag", type: 'public' });
    holidays.push({ date: fmt(whitMonday), name: "Tweede Pinksterdag", type: 'public' });

    return holidays.sort((a, b) => a.date.localeCompare(b.date));
  }

  private getEasterDate(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month - 1, day);
  }
}

export const netherlandsAdapter = new NetherlandsAdapter();