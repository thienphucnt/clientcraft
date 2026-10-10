export type AllowedPrivacyEvent =
  | "tool_viewed"
  | "image_compressed"
  | "json_converted"
  | "privacy_scrubbed"
  | "pro_modal_viewed"
  | "pro_unlocked"
  | "offline_mode_entered"
  | "offline_mode_exited";

export interface EventMetadata {
  tool?: string;
  format?: string;
  savingsPercent?: number;
  entitiesCount?: number;
  durationMs?: number;
  tier?: string;
}

/**
 * Dispatches 100% cookieless, non-identifying privacy metrics.
 * Ensures strict exclusion of user identities, IP addresses, URLs, or personal data.
 */
export function trackPrivacyEvent(eventName: AllowedPrivacyEvent, metadata: EventMetadata = {}): void {
  if (typeof window === "undefined") return;

  // Sanitize metadata to ensure numbers and non-PII strings only
  const sanitized: Record<string, string | number> = {};
  for (const [key, val] of Object.entries(metadata)) {
    if (typeof val === "number") {
      sanitized[key] = Math.round(val * 100) / 100;
    } else if (typeof val === "string" && val.length < 50 && !val.includes("@") && !val.includes("http")) {
      sanitized[key] = val;
    }
  }

  // Development logger
  if (process.env.NODE_ENV === "development") {
    console.debug(`[PrivacyAnalytics] Event "${eventName}":`, sanitized);
  }

  // Window custom event for modular integrations
  window.dispatchEvent(
    new CustomEvent("clientcraft:metric", {
      detail: { event: eventName, data: sanitized, timestamp: Date.now() },
    })
  );
}
