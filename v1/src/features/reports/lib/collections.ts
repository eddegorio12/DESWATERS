export const COLLECTIONS_TIME_ZONE = "Asia/Manila";

type SearchParamValue = string | string[] | undefined;

function getTimeZoneDateParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return { year, month, day };
}

function getUtcDayStart(year: number, month: number, day: number) {
  const start = new Date(Date.UTC(year, month - 1, day));
  return start;
}

function addUtcDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function getSingleSearchParamValue(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function isDateInputValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseDateInput(value: SearchParamValue) {
  const singleValue = getSingleSearchParamValue(value);

  if (!singleValue || !isDateInputValue(singleValue)) {
    return null;
  }

  const [year, month, day] = singleValue.split("-").map(Number);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const parsedDate = getUtcDayStart(year, month, day);

  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

export function getTodayCollectionRange(now = new Date()) {
  const { year, month, day } = getTimeZoneDateParts(now, COLLECTIONS_TIME_ZONE);
  const start = getUtcDayStart(year, month, day);
  const end = addUtcDays(start, 1);

  return {
    start,
    end,
    timeZone: COLLECTIONS_TIME_ZONE,
  };
}

export function formatCollectionDateInput(date: Date) {
  const { year, month, day } = getTimeZoneDateParts(date, COLLECTIONS_TIME_ZONE);

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatCollectionDayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: COLLECTIONS_TIME_ZONE,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatCollectionRangeLabel(start: Date, endExclusive: Date) {
  const inclusiveEnd = addUtcDays(endExclusive, -1);

  if (start.getTime() === inclusiveEnd.getTime()) {
    return formatCollectionDayLabel(start);
  }

  return `${formatCollectionDayLabel(start)} to ${formatCollectionDayLabel(inclusiveEnd)}`;
}

export function getCollectionRangeFromSearchParams(
  searchParams: Record<string, SearchParamValue>,
  now = new Date()
) {
  const todayRange = getTodayCollectionRange(now);
  const requestedStart = parseDateInput(searchParams.startDate);
  const requestedEnd = parseDateInput(searchParams.endDate);

  const start = requestedStart ?? requestedEnd ?? todayRange.start;
  let inclusiveEnd = requestedEnd ?? requestedStart ?? todayRange.start;

  if (inclusiveEnd.getTime() < start.getTime()) {
    inclusiveEnd = start;
  }

  const end = addUtcDays(inclusiveEnd, 1);

  return {
    start,
    end,
    timeZone: COLLECTIONS_TIME_ZONE,
    startDateInput: formatCollectionDateInput(start),
    endDateInput: formatCollectionDateInput(inclusiveEnd),
    rangeLabel: formatCollectionRangeLabel(start, end),
    dayCount: Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000)),
  };
}
