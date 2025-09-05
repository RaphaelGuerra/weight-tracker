import { addDays, eachDayOfInterval, endOfWeek, format, isAfter, isBefore, isSameDay, parseISO, startOfWeek } from 'date-fns';

export const fmtISO = (d: Date) => format(d, 'yyyy-MM-dd');
export const parse = (iso: string) => parseISO(iso);
export const todayISO = () => fmtISO(new Date());

export const weekStart = (iso: string) => startOfWeek(parseISO(iso), { weekStartsOn: 0 }); // Sun
export const weekEnd = (iso: string) => endOfWeek(parseISO(iso), { weekStartsOn: 0 }); // Sat

export const rangeDaysISO = (startISO: string, endISO: string) =>
  eachDayOfInterval({ start: parseISO(startISO), end: parseISO(endISO) }).map(fmtISO);

export const isWithinInclusive = (dateISO: string, startISO: string, endISO: string) => {
  const d = parseISO(dateISO), s = parseISO(startISO), e = parseISO(endISO);
  return (isSameDay(d, s) || isAfter(d, s)) && (isSameDay(d, e) || isBefore(d, e));
};

export const lastNDays = (n: number) => {
  const end = new Date();
  const start = addDays(end, -n + 1);
  return eachDayOfInterval({ start, end }).map(fmtISO);
};

