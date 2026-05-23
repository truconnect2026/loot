import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://loot.works";
  const lastModified = new Date();

  return [
    { url: baseUrl, lastModified, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/pro`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/flip`, lastModified, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/kit`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/pro/thanks`, lastModified, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/refund-policy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/contact`, lastModified, changeFrequency: "monthly", priority: 0.4 },
  ];
}
