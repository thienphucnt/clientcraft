export interface LicensePayload {
  tier: "pro_supporter" | "enterprise_lifetime";
  licensedTo: string;
  issuedAt: number;
}

export interface VerificationResult {
  valid: boolean;
  tier?: string;
  licensedTo?: string;
  issuedAt?: number;
  error?: string;
}

export interface StoredLicenseState {
  isUnlocked: boolean;
  licenseKey: string | null;
  tier: string | null;
  licensedTo: string | null;
  verifiedAt: number | null;
}

const SECRET_SALT = "clientcraft_v1_offline_hmac_master_signature_salt_2026";
const STORAGE_KEY = "clientcraft_pro_license_v1";

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Computes HMAC-SHA256 signature using the Web Crypto API
 */
async function computeHmacSha256(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoObj = typeof window !== "undefined" ? window.crypto : globalThis.crypto;

  if (!cryptoObj || !cryptoObj.subtle) {
    // Fallback simple hash for environments without SubtleCrypto
    let hash = 0;
    const combined = data + secret;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, "0");
  }

  const cryptoKey = await cryptoObj.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"]
  );

  const signature = await cryptoObj.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(data)
  );

  return bufferToHex(signature);
}

/**
 * Generates a cryptographically signed license key
 * Format: CCPRO-{base64Payload}-{hmacSignatureHex}
 */
export async function generateSignedLicense(
  tier: LicensePayload["tier"],
  licensedTo: string
): Promise<string> {
  const payload: LicensePayload = {
    tier,
    licensedTo,
    issuedAt: Date.now(),
  };

  const json = JSON.stringify(payload);
  const base64 = typeof btoa !== "undefined" ? btoa(json) : Buffer.from(json).toString("base64");
  const signature = await computeHmacSha256(base64, SECRET_SALT);

  return `CCPRO-${base64}-${signature}`;
}

/**
 * Verifies a license key using Web Crypto API cryptographic signature
 */
export async function verifyLicenseKey(licenseKey: string): Promise<VerificationResult> {
  if (!licenseKey || !licenseKey.startsWith("CCPRO-")) {
    return { valid: false, error: "Invalid license format. Must start with CCPRO-" };
  }

  const parts = licenseKey.split("-");
  if (parts.length < 3) {
    return { valid: false, error: "Malformed license string structure" };
  }

  const base64Payload = parts[1];
  const providedSignature = parts.slice(2).join("-");

  try {
    const expectedSignature = await computeHmacSha256(base64Payload, SECRET_SALT);

    if (providedSignature.toLowerCase() !== expectedSignature.toLowerCase()) {
      return { valid: false, error: "Cryptographic signature verification failed (tampered key)" };
    }

    const json = typeof atob !== "undefined" ? atob(base64Payload) : Buffer.from(base64Payload, "base64").toString("utf-8");
    const payload = JSON.parse(json) as LicensePayload;

    if (!payload.tier || !payload.licensedTo) {
      return { valid: false, error: "Missing required license payload fields" };
    }

    return {
      valid: true,
      tier: payload.tier === "enterprise_lifetime" ? "Enterprise Lifetime" : "Pro Supporter",
      licensedTo: payload.licensedTo,
      issuedAt: payload.issuedAt,
    };
  } catch (err) {
    return { valid: false, error: "Failed to parse license payload: " + (err instanceof Error ? err.message : "corrupt") };
  }
}

/**
 * Pre-computed valid demo license keys for instant testing and evaluation
 */
export const DEMO_PRECOMPUTED_LICENSES = {
  proSupporter: "CCPRO-eyJ0aWVyIjoicHJvX3N1cHBvcnRlciIsImxpY2Vuc2VkVG8iOiJkZXZlbG9wZXJAY2xpZW50Y3JhZnQuZGV2IiwiaXNzdWVkQXQiOjE3NjAxMDQwMDAwMDB9-d130e9d6d4ae7339c636f90d4e92a8bc333cba73e6a6a2a537fce0a775d71c4c",
  enterprise: "CCPRO-eyJ0aWVyIjoiZW50ZXJwcmlzZV9saWZldGltZSIsImxpY2Vuc2VkVG8iOiJhcmNoaXRlY3RAY2xpZW50Y3JhZnQuZGV2IiwiaXNzdWVkQXQiOjE3NjAxMDQwMDAwMDB9-21696a84cf9dc2ab5eef1d6688177543a6aa01e916ce0cf94e4ae0f1e0026e63",
};

/**
 * Gets stored license state from localStorage and cryptographically validates it
 */
export async function getStoredLicense(): Promise<StoredLicenseState> {
  if (typeof window === "undefined") {
    return { isUnlocked: false, licenseKey: null, tier: null, licensedTo: null, verifiedAt: null };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { isUnlocked: false, licenseKey: null, tier: null, licensedTo: null, verifiedAt: null };
    }

    const saved = JSON.parse(raw);
    if (!saved.licenseKey) {
      return { isUnlocked: false, licenseKey: null, tier: null, licensedTo: null, verifiedAt: null };
    }

    const check = await verifyLicenseKey(saved.licenseKey);
    if (check.valid) {
      return {
        isUnlocked: true,
        licenseKey: saved.licenseKey,
        tier: check.tier || "Pro",
        licensedTo: check.licensedTo || "Verified Supporter",
        verifiedAt: saved.verifiedAt || Date.now(),
      };
    } else {
      localStorage.removeItem(STORAGE_KEY);
      return { isUnlocked: false, licenseKey: null, tier: null, licensedTo: null, verifiedAt: null };
    }
  } catch {
    return { isUnlocked: false, licenseKey: null, tier: null, licensedTo: null, verifiedAt: null };
  }
}

/**
 * Saves and verifies license in localStorage
 */
export async function saveLicense(licenseKey: string): Promise<VerificationResult> {
  const result = await verifyLicenseKey(licenseKey);
  if (result.valid) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          licenseKey,
          tier: result.tier,
          licensedTo: result.licensedTo,
          verifiedAt: Date.now(),
        })
      );
    } catch {
      // Storage unavailable
    }
  }
  return result;
}

/**
 * Removes license from localStorage
 */
export function removeLicense(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}
