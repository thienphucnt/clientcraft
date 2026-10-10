import fs from "fs";
import path from "path";
import { ListingSchema, Listing, isListingFeatured } from "./schema";

const CONTENT_DIR = path.join(process.cwd(), "content", "listings");

let cachedListings: Listing[] | null = null;

/**
 * Loads all listing files from /content/listings/*.json, validates with Zod, and sorts.
 */
export function getAllListings(): Listing[] {
  if (cachedListings && process.env.NODE_ENV === "production") {
    return cachedListings;
  }

  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  const fileNames = fs.readdirSync(CONTENT_DIR);
  const listings: Listing[] = [];

  for (const fileName of fileNames) {
    if (!fileName.endsWith(".json")) continue;

    const fullPath = path.join(CONTENT_DIR, fileName);
    try {
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const rawJson = JSON.parse(fileContents);
      const parsed = ListingSchema.parse(rawJson);
      listings.push(parsed);
    } catch (err) {
      console.error(`Error parsing listing file ${fileName}:`, err);
      throw new Error(`Failed to parse listing file ${fileName}: ${String(err)}`);
    }
  }

  // Sort: active featured listings first, then by dateAdded descending, then title A-Z
  listings.sort((a, b) => {
    const aFeatured = isListingFeatured(a.featuredUntil);
    const bFeatured = isListingFeatured(b.featuredUntil);
    if (aFeatured && !bFeatured) return -1;
    if (!aFeatured && bFeatured) return 1;

    const dateDiff = new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    if (dateDiff !== 0) return dateDiff;

    return a.title.localeCompare(b.title);
  });

  cachedListings = listings;
  return listings;
}

/**
 * Find a single listing by slug
 */
export function getListingBySlug(slug: string): Listing | undefined {
  const listings = getAllListings();
  return listings.find((item) => item.slug === slug);
}

/**
 * Aggregate all distinct categories with listing counts
 */
export function getAllCategories(): { name: string; count: number }[] {
  const listings = getAllListings();
  const counts: Record<string, number> = {};

  for (const item of listings) {
    counts[item.category] = (counts[item.category] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Aggregate all distinct tags with listing counts
 */
export function getAllTags(): { name: string; count: number }[] {
  const listings = getAllListings();
  const counts: Record<string, number> = {};

  for (const item of listings) {
    for (const tag of item.tags) {
      const normalized = tag.toLowerCase().trim();
      counts[normalized] = (counts[normalized] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Find related alternatives: matching category or shared tags, excluding self
 */
export function getRelatedListings(current: Listing, limit: number = 3): Listing[] {
  const listings = getAllListings().filter((item) => item.slug !== current.slug);
  const currentTags = new Set(current.tags.map((t) => t.toLowerCase()));

  // Score candidates: +5 for same category, +2 per shared tag
  const scored = listings.map((item) => {
    let score = 0;
    if (item.category === current.category) score += 5;
    for (const tag of item.tags) {
      if (currentTags.has(tag.toLowerCase())) {
        score += 2;
      }
    }
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));

  return scored.slice(0, limit).map((s) => s.item);
}
