const RECEIPT_PREFIX = "OR";

function formatDatePart(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");

  return `${year}${month}${day}`;
}

function formatTimePart(value: Date) {
  const hours = `${value.getHours()}`.padStart(2, "0");
  const minutes = `${value.getMinutes()}`.padStart(2, "0");
  const seconds = `${value.getSeconds()}`.padStart(2, "0");

  return `${hours}${minutes}${seconds}`;
}

export function createReceiptNumber(now = new Date()) {
  const randomPart = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `${RECEIPT_PREFIX}-${formatDatePart(now)}-${formatTimePart(now)}-${randomPart}`;
}
