export function roundMetric(value: number) {
  return Math.round(value * 100) / 100;
}

export function percentage(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return 0;
  }

  return roundMetric((numerator / denominator) * 100);
}

export function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return roundMetric(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");

  return `${year}-${month}`;
}

export function formatTrendLabel(input: string | Date) {
  const date =
    typeof input === "string"
      ? new Date(`${input}-01T00:00:00`)
      : new Date(input.getFullYear(), input.getMonth(), 1);

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function getRecentMonthKeys(count: number, anchor = new Date()) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(anchor.getFullYear(), anchor.getMonth() - (count - index - 1), 1);
    return toMonthKey(date);
  });
}

export function getDaysPastDue(dueDate: Date, referenceDate = new Date()) {
  const startOfReference = new Date(referenceDate);
  startOfReference.setHours(0, 0, 0, 0);

  const startOfDueDate = new Date(dueDate);
  startOfDueDate.setHours(0, 0, 0, 0);

  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  return Math.floor((startOfReference.getTime() - startOfDueDate.getTime()) / millisecondsPerDay);
}
