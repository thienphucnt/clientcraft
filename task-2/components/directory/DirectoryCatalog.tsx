"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
  Layers,
  Tag,
} from "lucide-react";
import { Listing, isListingFeatured } from "@/lib/listings/schema";
import { ListingCard } from "./ListingCard";

interface DirectoryCatalogProps {
  initialListings: Listing[];
  categories: { name: string; count: number }[];
  allTags: { name: string; count: number }[];
}

type SortOption = "featured" | "newest" | "name";

export function DirectoryCatalog({
  initialListings,
  categories,
  allTags,
}: DirectoryCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedPricing, setSelectedPricing] = useState<string>("All");
  const [sortBy, setSortBy] = useState<SortOption>("featured");

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: '/' focuses search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const pricingModels = ["All", "Free", "Freemium", "Open Source", "Paid", "Free Trial"];

  // Filter & sort logic
  const filteredListings = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return initialListings
      .filter((item) => {
        // Category filter
        if (selectedCategory !== "All" && item.category !== selectedCategory) {
          return false;
        }

        // Pricing filter
        if (selectedPricing !== "All" && item.pricingModel !== selectedPricing) {
          return false;
        }

        // Tag filter
        if (
          selectedTag &&
          !item.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase())
        ) {
          return false;
        }

        // Search text matching
        if (query) {
          const matchTitle = item.title.toLowerCase().includes(query);
          const matchDesc = item.description.toLowerCase().includes(query);
          const matchTags = item.tags.some((t) => t.toLowerCase().includes(query));
          const matchCategory = item.category.toLowerCase().includes(query);
          const matchPricing = item.pricingModel.toLowerCase().includes(query);
          return matchTitle || matchDesc || matchTags || matchCategory || matchPricing;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "featured") {
          const aFeatured = isListingFeatured(a.featuredUntil);
          const bFeatured = isListingFeatured(b.featuredUntil);
          if (aFeatured && !bFeatured) return -1;
          if (!aFeatured && bFeatured) return 1;
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        }

        if (sortBy === "newest") {
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        }

        if (sortBy === "name") {
          return a.title.localeCompare(b.title);
        }

        return 0;
      });
  }, [initialListings, searchQuery, selectedCategory, selectedTag, selectedPricing, sortBy]);

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCategory !== "All" ||
    selectedTag !== null ||
    selectedPricing !== "All";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedTag(null);
    setSelectedPricing("All");
    setSortBy("featured");
  };

  // Compute top popular tags for the chips bar
  const popularTags = useMemo(() => {
    return allTags.slice(0, 12);
  }, [allTags]);

  return (
    <section className="space-y-8" id="catalog">
      {/* Search Bar & Instant Controls */}
      <div className="bg-white/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm backdrop-blur-md space-y-5">
        <div className="flex flex-col md:flex-row gap-3.5 items-stretch md:items-center justify-between">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 20+ verified developer tools, AI models, libraries, or tags..."
              className="w-full pl-10 pr-20 py-2.5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded">
                  /
                </kbd>
              )}
            </div>
          </div>

          {/* Pricing Model & Sort Options */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 md:pb-0">
            {/* Pricing Model Dropdown */}
            <div className="relative shrink-0">
              <select
                value={selectedPricing}
                onChange={(e) => setSelectedPricing(e.target.value)}
                className="appearance-none pl-8 pr-8 py-2 rounded-xl text-xs font-semibold bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {pricingModels.map((p) => (
                  <option key={p} value={p}>
                    {p === "All" ? "All Pricing" : p}
                  </option>
                ))}
              </select>
              <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none pl-8 pr-8 py-2 rounded-xl text-xs font-semibold bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="featured">Sort: Featured First</option>
                <option value="newest">Sort: Newest Added</option>
                <option value="name">Sort: Alphabetical (A-Z)</option>
              </select>
              <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>

            {/* Clear All Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="space-y-2.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Layers className="w-3.5 h-3.5" />
            <span>Categories</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            {/* "All" Category Pill */}
            <button
              onClick={() => setSelectedCategory("All")}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedCategory === "All"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <span>All Categories</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  selectedCategory === "All"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                }`}
              >
                {initialListings.length}
              </span>
            </button>

            {/* Individual Categories */}
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tag Filters Cloud */}
        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Tag className="w-3.5 h-3.5" />
              <span>Popular Tags</span>
            </div>

            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear tag &quot;{selectedTag}&quot;
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {popularTags.map((tag) => {
              const isSelected = selectedTag === tag.name;
              return (
                <button
                  key={tag.name}
                  onClick={() => setSelectedTag(isSelected ? null : tag.name)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 ring-2 ring-blue-500 shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span>#{tag.name}</span>
                  <span className="text-[10px] opacity-60">({tag.count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Catalog Results Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Resource Directory
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            {filteredListings.length} {filteredListings.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Filtering active:</span>
            {selectedCategory !== "All" && (
              <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {selectedCategory}
              </span>
            )}
            {selectedTag && (
              <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                #{selectedTag}
              </span>
            )}
            {selectedPricing !== "All" && (
              <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {selectedPricing}
              </span>
            )}
            {searchQuery && (
              <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 italic">
                &ldquo;{searchQuery}&rdquo;
              </span>
            )}
          </div>
        )}
      </div>

      {/* Grid of Listings or Empty State */}
      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onSelectTag={(tag) => setSelectedTag(tag)}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white/60 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mx-auto flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No matching tech resources found
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              We couldn&apos;t find any entries matching your current filters or search term. Try broadening your criteria.
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}
    </section>
  );
}
