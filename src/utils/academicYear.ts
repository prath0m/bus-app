// Indian school academic year: April through the following March (schools
// close for summer break roughly April-June, so the payment calendar should
// only ever step through this 12-month window instead of an arbitrary
// Jan-Dec range).

export interface AcademicMonth {
  year: number;
  month: number; // 1-12
}

const MONTH_ORDER = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

export const getAcademicStartYear = (date: Date = new Date()): number => {
  const month = date.getMonth() + 1;
  return month >= 4 ? date.getFullYear() : date.getFullYear() - 1;
};

export const getAcademicYearLabel = (startYear: number): string => {
  return `${startYear}–${String(startYear + 1).slice(-2)}`;
};

export const getAcademicMonths = (startYear: number): AcademicMonth[] => {
  return MONTH_ORDER.map((month) => ({
    year: month >= 4 ? startYear : startYear + 1,
    month,
  }));
};

export const isSameAcademicMonth = (a: AcademicMonth, b: AcademicMonth): boolean => {
  return a.year === b.year && a.month === b.month;
};
