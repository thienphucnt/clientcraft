import { z } from "zod";

export const PricingModelSchema = z.enum([
  "Free",
  "Freemium",
  "Open Source",
  "Paid",
  "Free Trial",
]);

export type PricingModel = z.infer<typeof PricingModelSchema>;

export const ListingSchema = z.object({
  id: z.string().min(1, "ID is required"),
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
  url: z.string().url("Valid URL is required"),
  affiliateUrl: z.string().url().nullable().optional(),
  featuredUntil: z.string().nullable().optional(), // ISO 8601 date string e.g. "2026-12-31T23:59:59Z"
  pricingModel: PricingModelSchema,
  dateAdded: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "dateAdded must be YYYY-MM-DD format"),
  
  // Extended fields for rich feature breakdowns and programmatic pages
  verified: z.boolean().default(true),
  features: z.array(z.string()).default([]),
  highlights: z.array(z.string()).optional(),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  targetAudience: z.string().optional(),
  githubUrl: z.string().url().optional(),
  stars: z.string().optional(),
  license: z.string().optional(),
});

export type Listing = z.infer<typeof ListingSchema>;

/**
 * Helper to determine whether a listing has an active featured sponsor status
 */
export function isListingFeatured(featuredUntil?: string | null): boolean {
  if (!featuredUntil) return false;
  try {
    const expiry = new Date(featuredUntil).getTime();
    return !isNaN(expiry) && expiry > Date.now();
  } catch {
    return false;
  }
}
