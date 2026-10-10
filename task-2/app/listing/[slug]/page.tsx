import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  Tag,
  Layers,
  Zap,
} from "lucide-react";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}
import {
  getAllListings,
  getListingBySlug,
  getRelatedListings,
} from "@/lib/listings/loader";
import { isListingFeatured } from "@/lib/listings/schema";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { AlternativeCard } from "@/components/directory/AlternativeCard";

export const dynamic = "force-static";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const listings = getAllListings();
  return listings.map((item) => ({
    slug: item.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = getListingBySlug(slug);

  if (!listing) {
    return {
      title: "Listing Not Found — DevStack Directory",
    };
  }

  return {
    title: `${listing.title} — Features, Pricing & Alternatives | DevStack Directory`,
    description: listing.description,
    keywords: [
      listing.title,
      listing.category,
      ...listing.tags,
      listing.pricingModel,
      "developer directory",
    ],
    openGraph: {
      title: `${listing.title} — Verified Tech Review & Alternatives`,
      description: listing.description,
      type: "article",
    },
    alternates: {
      canonical: `/listing/${listing.slug}`,
    },
  };
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const listing = getListingBySlug(slug);

  if (!listing) {
    notFound();
  }

  const related = getRelatedListings(listing, 3);
  const isFeatured = isListingFeatured(listing.featuredUntil);
  const outboundUrl = listing.affiliateUrl || listing.url;

  // JSON-LD structured data for rich snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: listing.title,
    description: listing.description,
    applicationCategory: listing.category,
    offers: {
      "@type": "Offer",
      price: listing.pricingModel === "Free" || listing.pricingModel === "Open Source" ? "0.00" : undefined,
      priceCurrency: "USD",
      category: listing.pricingModel,
    },
    url: listing.url,
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Global Header */}
      <Header />

      {/* JSON-LD Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Directory
            </Link>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-300">
              {listing.category}
            </span>
            <span>/</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {listing.title}
            </span>
          </div>

          <Link
            href="/#catalog"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Listings</span>
          </Link>
        </div>

        {/* Hero Card */}
        <section className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900/[0.03] via-blue-900/[0.04] to-indigo-900/[0.03] dark:from-slate-900/80 dark:via-blue-950/20 dark:to-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              {/* Badges Bar */}
              <div className="flex items-center flex-wrap gap-2">
                {isFeatured && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs shadow-blue-500/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    Featured Partner
                  </span>
                )}

                {listing.verified && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Architecture
                  </span>
                )}

                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Layers className="w-3.5 h-3.5" />
                  {listing.category}
                </span>

                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {listing.pricingModel}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {listing.title}
                </h1>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                  {listing.description}
                </p>
              </div>

              {/* Tags Cloud */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {listing.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    <Tag className="w-2.5 h-2.5 opacity-50" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Outbound CTAs Box */}
            <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-5 rounded-2xl shrink-0 sm:w-72 space-y-3.5 shadow-sm">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Pricing Model:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {listing.pricingModel}
                </span>
              </div>

              {/* Direct Outbound Action Button with strict rel attribute */}
              <a
                href={outboundUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-md shadow-blue-500/20 transition-all"
              >
                <span>Visit Official Site</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              {/* GitHub Button if applicable */}
              {listing.githubUrl && (
                <a
                  href={listing.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                >
                  <GitHubIcon className="w-3.5 h-3.5" />
                  <span>GitHub Repository {listing.stars ? `(${listing.stars})` : ""}</span>
                </a>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Added: {listing.dateAdded}
                </span>
                <span>ID: {listing.id}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Breakdown Section */}
        {listing.features.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Core Architectural Features
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {listing.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {feature}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pros & Cons Section */}
        {(listing.pros.length > 0 || listing.cons.length > 0) && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Evaluation &amp; Trade-offs
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pros Card */}
              {listing.pros.length > 0 && (
                <div className="p-5 rounded-2xl bg-emerald-500/[0.03] dark:bg-emerald-950/20 border border-emerald-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <h3>Key Advantages</h3>
                  </div>
                  <ul className="space-y-2">
                    {listing.pros.map((pro, idx) => (
                      <li
                        key={idx}
                        className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2 leading-relaxed"
                      >
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cons Card */}
              {listing.cons.length > 0 && (
                <div className="p-5 rounded-2xl bg-amber-500/[0.03] dark:bg-amber-950/20 border border-amber-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                    <XCircle className="w-4 h-4" />
                    <h3>Considerations &amp; Trade-offs</h3>
                  </div>
                  <ul className="space-y-2">
                    {listing.cons.map((con, idx) => (
                      <li
                        key={idx}
                        className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2 leading-relaxed"
                      >
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Technical Specifications Matrix */}
        <section className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Technical Specification Matrix
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-400 block mb-1">Catalog Identifier</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                {listing.id}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-400 block mb-1">Architecture Category</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {listing.category}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-400 block mb-1">Pricing Model</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {listing.pricingModel}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-400 block mb-1">Verification Status</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {listing.verified ? "Peer Verified" : "Community"}
              </span>
            </div>
          </div>

          {listing.targetAudience && (
            <div className="pt-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-white">
                Best Suited For:{" "}
              </span>
              {listing.targetAudience}
            </div>
          )}
        </section>

        {/* Related Alternatives Section */}
        {related.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Related Alternatives &amp; Competitors
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Explore closely related solutions in {listing.category}
                </p>
              </div>

              <Link
                href="/#catalog"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View all tools →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map((alt) => (
                <AlternativeCard key={alt.id} alternative={alt} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
