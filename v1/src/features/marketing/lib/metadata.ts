import type { Metadata } from "next";

import { buildAbsoluteUrl, getSiteUrl } from "@/features/marketing/lib/site-config";

const defaultSocialImage = buildAbsoluteUrl("/opengraph-image");

export function createMarketingMetadata({
  title,
  description,
  pathname,
}: {
  title: string;
  description: string;
  pathname: string;
}): Metadata {
  const url = buildAbsoluteUrl(pathname);

  return {
    title,
    description,
    alternates: {
      canonical: pathname,
    },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "DWDS",
      images: [
        {
          url: defaultSocialImage,
          width: 1200,
          height: 630,
          alt: "DWDS water utility operations platform",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultSocialImage],
    },
  };
}

export function createRootMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  const title = "DWDS | Water Utility Operations Platform";
  const description =
    "DWDS is a staff-facing water utility operations platform for customer records, metering, billing governance, cashiering, collections review, and overdue follow-up.";

  return {
    metadataBase: new URL(siteUrl),
    applicationName: "DWDS",
    title: {
      default: title,
      template: "%s | DWDS",
    },
    description,
    keywords: [
      "water utility operations",
      "billing and collections",
      "meter reading workflow",
      "utility management system",
      "DWDS",
    ],
    alternates: {
      canonical: "/",
    },
    category: "business",
    openGraph: {
      type: "website",
      url: siteUrl,
      title,
      description,
      siteName: "DWDS",
      locale: "en_PH",
      images: [
        {
          url: defaultSocialImage,
          width: 1200,
          height: 630,
          alt: "DWDS water utility operations platform",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultSocialImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    icons: {
      icon: [
        { url: "/icon.png", type: "image/png" },
        { url: "/apple-icon.png", type: "image/png", sizes: "180x180" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
  };
}
