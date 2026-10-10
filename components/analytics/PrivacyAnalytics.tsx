"use client";

import Script from "next/script";

interface PrivacyAnalyticsProps {
  cloudflareToken?: string;
}

/**
 * PrivacyAnalytics Component:
 * Injects Cloudflare Web Analytics beacon script (100% cookie-free, no fingerprinting).
 * Only activates if a token is provided; otherwise remains completely silent.
 */
export function PrivacyAnalytics({ cloudflareToken }: PrivacyAnalyticsProps) {
  const token = cloudflareToken || process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN;

  if (!token) {
    return null;
  }

  return (
    <Script
      strategy="afterInteractive"
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token })}
    />
  );
}
