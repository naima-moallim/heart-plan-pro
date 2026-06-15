import { format, eachDayOfInterval, eachWeekOfInterval, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

export function fmtDate(d: string | Date, pattern = "d MMMM yyyy") {
  const date = typeof d === "string" ? parseISO(d) : d;
  return format(date, pattern, { locale: ar });
}

export function shortDate(d: string | Date) {
  return fmtDate(d, "d MMM");
}

export function todayISO() {
  return format(new Date(), "yyyy-MM-dd");
}

export function buildWeeks(startISO: string, endISO: string) {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  // weeks starting Saturday (Arabic week start)
  const weekStarts = eachWeekOfInterval({ start, end }, { weekStartsOn: 6 });
  return weekStarts.map((ws, i) => {
    const we = endOfWeek(ws, { weekStartsOn: 6 });
    return {
      week_number: i + 1,
      start_date: format(ws < start ? start : ws, "yyyy-MM-dd"),
      end_date: format(we > end ? end : we, "yyyy-MM-dd"),
    };
  });
}

export function daysBetween(startISO: string, endISO: string) {
  const days = eachDayOfInterval({ start: parseISO(startISO), end: parseISO(endISO) });
  return days.map(d => format(d, "yyyy-MM-dd"));
}

export function isCurrentRange(startISO: string, endISO: string) {
  return isWithinInterval(new Date(), { start: parseISO(startISO), end: parseISO(endISO) });
}
