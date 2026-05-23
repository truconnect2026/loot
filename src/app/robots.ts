import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/pro",
          "/flip",
          "/kit",
          "/pro/thanks",
          "/terms",
          "/privacy",
          "/refund-policy",
          "/contact",
        ],
        disallow: ["/app", "/app/*", "/welcome", "/onboarding", "/api/*"],
      },
    ],
    sitemap: "https://loot.works/sitemap.xml",
  };
}
