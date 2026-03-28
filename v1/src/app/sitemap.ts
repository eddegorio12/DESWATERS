import type { MetadataRoute } from "next";

import { buildAbsoluteUrl } from "@/features/marketing/lib/site-config";

const marketingRoutes = ["/", "/platform", "/workflows", "/rollout", "/contact"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return marketingRoutes.map((route) => ({
    url: buildAbsoluteUrl(route),
    lastModified,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route === "/contact" ? 0.9 : 0.8,
  }));
}
