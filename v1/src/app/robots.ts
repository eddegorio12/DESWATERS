import type { MetadataRoute } from "next";

import { buildAbsoluteUrl } from "@/features/marketing/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/dashboard/", "/api/auth/"],
    },
    sitemap: buildAbsoluteUrl("/sitemap.xml"),
    host: buildAbsoluteUrl("/"),
  };
}
