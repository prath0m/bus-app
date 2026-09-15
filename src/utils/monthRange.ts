// Generic month/year range helpers — unlike academicYear.ts (fixed April-March),
// these support any arbitrary start month, since different schools open in
// April, May, or June depending on the year/board.

export interface MonthYear {
  year: number;
  month: number; // 1-12
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const addMonths = (base: MonthYear, delta: number): MonthYear => {
  const totalMonths = base.year * 12 + (base.month - 1) + delta;
  const year = Math.floor(totalMonths / 12);
  const month = (totalMonths % 12) + 1;
  return { year, month };
};

export const formatMonthYear = (m: MonthYear): string => `${MONTH_SHORT[m.month - 1]} ${m.year}`;

export const monthsInRange = (start: MonthYear, durationMonths: number): MonthYear[] => {
  return Array.from({ length: durationMonths }, (_, i) => addMonths(start, i));
};

export const isSameMonthYear = (a: MonthYear, b: MonthYear): boolean => a.year === b.year && a.month === b.month;
