"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Check,
  Share2,
  Tag as TagIcon,
} from "lucide-react";
import { Listing, isListingFeatured } from "@/lib/listings/schema";

interface ListingCardProps {
  listing: Listing;
  onSelectTag?: (tag: string) => void;
  onSelectCategory?: (category: string) => void;
}

export function ListingCard({
  listing,
  onSelectTag,
  onSelectCategory,
}: ListingCardProps) {
  const [copied, setCopied] = useState(false);
  const isFeatured = isListingFeatured(listing.featuredUntil);
  const outboundUrl = listing.affiliateUrl || listing.url;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fullUrl = `${window.location.origin}/listing/${listing.slug}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getPricingBadgeColor = (model: string) => {
    switch (model) {
      case "Open Source":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "Free":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
      case "Freemium":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "Free Trial":
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20";
      case "Paid":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl p-5 sm:p-6 transition-all duration-300 border ${
        isFeatured
          ? "bg-gradient-to-b from-blue-500/5 via-indigo-500/5 to-transparent dark:from-blue-950/40 dark:via-slate-900/60 dark:to-slate-900/40 border-blue-500/30 dark:border-blue-500/30 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/20"
          : "bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md hover:shadow-slate-500/5"
      }`}
    >
      <div>
        {/* Top Badges Header */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center flex-wrap gap-1.5">
            {/* Featured Badge */}
            {isFeatured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs shadow-blue-500/20 animate-pulse">
                <Sparkles className="w-3 h-3" />
                Featured
              </span>
            )}

            {/* Verification Badge */}
            {listing.verified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                Verified
              </span>
            )}

            {/* Pricing Model Badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getPricingBadgeColor(
                listing.pricingModel
              )}`}
            >
              {listing.pricingModel}
            </span>
          </div>

          {/* Quick Share / Copy URL button */}
          <button
            onClick={handleCopyLink}
            title="Copy shareable link"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Title and Category */}
        <div className="mb-2">
          <div className="flex items-baseline justify-between gap-2">
            <Link
              href={`/listing/${listing.slug}`}
              className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
            >
              {listing.title}
            </Link>
          </div>

          <button
            onClick={() => onSelectCategory?.(listing.category)}
            className="inline-block mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {listing.category}
          </button>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 mb-4">
          {listing.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {listing.tags.slice(0, 4).map((tag) => (
            <button
              key={tag}
              onClick={() => onSelectTag?.(tag)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-transparent hover:border-blue-500/20"
            >
              <TagIcon className="w-2.5 h-2.5 opacity-60" />
              <span>{tag}</span>
            </button>
          ))}
          {listing.tags.length > 4 && (
            <span className="text-[10px] text-slate-400 self-center">
              +{listing.tags.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
        {/* Outbound Direct Link with strict rel attributes */}
        <a
          href={outboundUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors group/btn"
        >
          <span>Visit Site</span>
          <ExternalLink className="w-3 h-3 text-slate-500 group-hover/btn:text-slate-900 dark:group-hover/btn:text-white transition-colors" />
        </a>

        {/* Slug Details Link */}
        <Link
          href={`/listing/${listing.slug}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group/link"
        >
          <span>Full Specs</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
