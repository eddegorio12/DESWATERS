export function normalizePhilippineMobileNumber(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/[^\d+]/g, "");

  if (/^\+639\d{9}$/.test(normalized)) {
    return normalized;
  }

  if (/^639\d{9}$/.test(normalized)) {
    return `+${normalized}`;
  }

  if (/^09\d{9}$/.test(normalized)) {
    return `+63${normalized.slice(1)}`;
  }

  return null;
}
