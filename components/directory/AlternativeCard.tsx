"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Listing, isListingFeatured } from "@/lib/listings/schema";

interface AlternativeCardProps {
  alternative: Listing;
}

export function AlternativeCard({ alternative }: AlternativeCardProps) {
  const isFeatured = isListingFeatured(alternative.featuredUntil);
  const outboundUrl = alternative.affiliateUrl || alternative.url;

  return (
    <div className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isFeatured && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-600 text-white">
                <Sparkles className="w-2.5 h-2.5" />
                Featured
              </span>
            )}
            {alternative.verified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-2.5 h-2.5" />
                Verified
              </span>
            )}
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {alternative.pricingModel}
            </span>
          </div>

          <span className="text-[11px] font-medium text-slate-400">
            {alternative.category}
          </span>
        </div>

        <div>
          <Link
            href={`/listing/${alternative.slug}`}
            className="text-base font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {alternative.title}
          </Link>
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-1 leading-relaxed">
            {alternative.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-1">
          {alternative.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <a
          href={outboundUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <span>Outbound</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>

        <Link
          href={`/listing/${alternative.slug}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <span>Compare Specs</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
