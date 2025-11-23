import { RegionAdapter, Holiday } from '../../types';
import { addDays, format } from 'date-fns';

export class BelgiumFlandersAdapter implements RegionAdapter {
  id = 'BE-VLG';
  name = 'België (Vlaanderen)';
  description = 'Inclusief Belgische nationale feestdagen en de Vlaamse Feestdag (11 juli).';

  getDefaultWeekdays(): number[] {
    return [1, 2, 3, 4, 5]; // Ma-Vr
  }

  getPublicHolidays(year: number): Holiday[] {
    const holidays: Holiday[] = [];
    const fmt = (date: Date) => format(date, 'yyyy-MM-dd');

    // 1. Vaste Datums
    holidays.push({ date: `${year}-01-01`, name: "Nieuwjaar", type: 'public' });
    holidays.push({ date: `${year}-05-01`, name: "Dag van de Arbeid", type: 'public' });
    holidays.push({ date: `${year}-07-11`, name: "Feest van de Vlaamse Gemeenschap", type: 'regional' });
    holidays.push({ date: `${year}-07-21`, name: "Nationale Feestdag", type: 'public' });
    holidays.push({ date: `${year}-08-15`, name: "O.L.V. Hemelvaart", type: 'public' });
    holidays.push({ date: `${year}-11-01`, name: "Allerheiligen", type: 'public' });
    holidays.push({ date: `${year}-11-11`, name: "Wapenstilstand", type: 'public' });
    holidays.push({ date: `${year}-12-25`, name: "Kerstmis", type: 'public' });

    // 2. Variabele Datums (Pasen gebaseerd)
    const easter = this.getEasterDate(year);
    const easterMonday = addDays(easter, 1);
    const ascensionDay = addDays(easter, 39);
    const whitMonday = addDays(easter, 50);

    holidays.push({ date: fmt(easterMonday), name: "Paasmaandag", type: 'public' });
    holidays.push({ date: fmt(ascensionDay), name: "O.L.H. Hemelvaart", type: 'public' });
    holidays.push({ date: fmt(whitMonday), name: "Pinkstermaandag", type: 'public' });

    return holidays.sort((a, b) => a.date.localeCompare(b.date));
  }

  // Anoniem algoritme om Pasen te berekenen
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
    const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = Maart, 4 = April
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month - 1, day);
  }
}

export const belgiumFlandersAdapter = new BelgiumFlandersAdapter();