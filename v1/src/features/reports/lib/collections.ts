const COLLECTIONS_TIME_ZONE = "Asia/Manila";

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

export function getTodayCollectionRange(now = new Date()) {
  const { year, month, day } = getTimeZoneDateParts(now, COLLECTIONS_TIME_ZONE);
  const start = new Date(Date.UTC(year, month - 1, day));
  const end = new Date(Date.UTC(year, month - 1, day + 1));

  return {
    start,
    end,
    timeZone: COLLECTIONS_TIME_ZONE,
  };
}

export function formatCollectionDayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: COLLECTIONS_TIME_ZONE,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
