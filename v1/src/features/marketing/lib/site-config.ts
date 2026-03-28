export const DEFAULT_SITE_URL = "https://dwds.example.com";
export const DEFAULT_CONTACT_EMAIL = "ops@example.com";

function normalizeUrl(value?: string | null) {
  if (!value) {
    return DEFAULT_SITE_URL;
  }

  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function getSiteUrl() {
  return normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL);
}

export function getContactEmail() {
  return process.env.DWDS_PUBLIC_CONTACT_EMAIL || DEFAULT_CONTACT_EMAIL;
}

export function buildAbsoluteUrl(pathname = "/") {
  return new URL(pathname, getSiteUrl()).toString();
}

export function buildMailtoLink(options?: {
  subject?: string;
  body?: string;
  email?: string;
}) {
  const email = options?.email ?? getContactEmail();
  const searchParams = new URLSearchParams();

  if (options?.subject) {
    searchParams.set("subject", options.subject);
  }

  if (options?.body) {
    searchParams.set("body", options.body);
  }

  const query = searchParams.toString();
  return `mailto:${email}${query ? `?${query}` : ""}`;
}
