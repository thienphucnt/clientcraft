import type { MetadataRoute } from "next";
import { getAllListings } from "@/lib/listings/loader";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://clientcraft.dev";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/tools/image-compressor`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tools/json-to-typescript`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tools/text-privacy-scrubber`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const listingRoutes: MetadataRoute.Sitemap = getAllListings().map((listing) => ({
    url: `${baseUrl}/listing/${listing.slug}`,
    lastModified: new Date(listing.dateAdded),
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticRoutes, ...listingRoutes];
}
