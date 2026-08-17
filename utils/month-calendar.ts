import { isSameCalendarDay, normalizeCalendarDate } from '@/utils/jogos-time';

export const WEEKDAY_LABELS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;

const MONTH_NAMES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
] as const;

export type MonthCalendarCell = {
  date: Date;
  inCurrentMonth: boolean;
};

export function getMonthName(monthIndex: number): string {
  return MONTH_NAMES[monthIndex] ?? MONTH_NAMES[0];
}

export function buildMonthCalendarGrid(year: number, monthIndex: number): MonthCalendarCell[] {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  let mondayOffset = firstOfMonth.getDay() - 1;
  if (mondayOffset < 0) {
    mondayOffset = 6;
  }

  const cells: MonthCalendarCell[] = [];
  const leadingDays = new Date(year, monthIndex, 0).getDate();

  for (let index = mondayOffset - 1; index >= 0; index -= 1) {
    cells.push({
      date: normalizeCalendarDate(new Date(year, monthIndex - 1, leadingDays - index)),
      inCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      date: normalizeCalendarDate(new Date(year, monthIndex, day)),
      inCurrentMonth: true,
    });
  }

  let trailingDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      date: normalizeCalendarDate(new Date(year, monthIndex + 1, trailingDay)),
      inCurrentMonth: false,
    });
    trailingDay += 1;
  }

  while (cells.length < 42) {
    cells.push({
      date: normalizeCalendarDate(new Date(year, monthIndex + 1, trailingDay)),
      inCurrentMonth: false,
    });
    trailingDay += 1;
  }

  return cells;
}

export function isDateWithinRange(
  date: Date,
  minimumDate?: Date,
  maximumDate?: Date,
): boolean {
  const normalized = normalizeCalendarDate(date).getTime();
  const min = minimumDate ? normalizeCalendarDate(minimumDate).getTime() : null;
  const max = maximumDate ? normalizeCalendarDate(maximumDate).getTime() : null;

  if (min != null && normalized < min) {
    return false;
  }

  if (max != null && normalized > max) {
    return false;
  }

  return true;
}

export function isSameMonthView(dateA: Date, year: number, monthIndex: number): boolean {
  return dateA.getFullYear() === year && dateA.getMonth() === monthIndex;
}

export function addMonthsToView(year: number, monthIndex: number, delta: number): {
  year: number;
  monthIndex: number;
} {
  const date = new Date(year, monthIndex + delta, 1);

  return {
    year: date.getFullYear(),
    monthIndex: date.getMonth(),
  };
}

export function getInitialVisibleMonth(
  value: Date,
  minimumDate?: Date,
  maximumDate?: Date,
): { year: number; monthIndex: number } {
  const normalizedValue = normalizeCalendarDate(value);

  if (isDateWithinRange(normalizedValue, minimumDate, maximumDate)) {
    return {
      year: normalizedValue.getFullYear(),
      monthIndex: normalizedValue.getMonth(),
    };
  }

  if (maximumDate && !isDateWithinRange(normalizedValue, minimumDate, maximumDate)) {
    const max = normalizeCalendarDate(maximumDate);
    return {
      year: max.getFullYear(),
      monthIndex: max.getMonth(),
    };
  }

  if (minimumDate) {
    const min = normalizeCalendarDate(minimumDate);
    return {
      year: min.getFullYear(),
      monthIndex: min.getMonth(),
    };
  }

  return {
    year: normalizedValue.getFullYear(),
    monthIndex: normalizedValue.getMonth(),
  };
}

export function isToday(date: Date, referenceDate = new Date()): boolean {
  return isSameCalendarDay(date, referenceDate);
}
