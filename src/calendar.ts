const HOLIDAYS = new Set([
  '2025-01-01','2025-01-02','2025-01-03','2025-01-06','2025-01-07','2025-01-08',
  '2025-02-24','2025-03-10','2025-05-01','2025-05-02','2025-05-08','2025-05-09',
  '2025-06-12','2025-06-13','2025-11-03','2025-11-04','2025-12-31',
  '2026-01-01','2026-01-02','2026-01-03','2026-01-04','2026-01-05','2026-01-06','2026-01-07','2026-01-08',
  '2026-02-23','2026-03-09','2026-05-01','2026-05-11','2026-06-12','2026-11-04',
]);

function toStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function isNonWorkingDay(d: Date): boolean {
  const ds = toStr(d);
  if (HOLIDAYS.has(ds)) return true;
  const dow = d.getDay();
  return dow === 0 || dow === 6;
}

export interface DayInfo {
  date: Date;
  dateStr: string;
  isWeekend: boolean;
  isToday: boolean;
  isCurrentMonth: boolean;
  dayOfMonth: number;
}

export function getMonthGrid(year: number, month: number): DayInfo[] {
  const todayStr = toStr(new Date());
  const firstOfMonth = new Date(year, month, 1);
  const dow = firstOfMonth.getDay();
  const offset = (dow + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  const days: DayInfo[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const ds = toStr(d);
    days.push({ date: d, dateStr: ds, isWeekend: isNonWorkingDay(d), isToday: ds === todayStr, isCurrentMonth: d.getMonth() === month, dayOfMonth: d.getDate() });
  }
  return days;
}

export const MONTH_NAMES_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
export const WEEKDAY_SHORT_RU = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
