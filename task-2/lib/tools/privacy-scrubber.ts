export type RedactionStyle = "placeholder" | "generic" | "masked" | "erase";

export interface PrivacyScrubOptions {
  scrubEmails?: boolean;
  scrubPhones?: boolean;
  scrubApiKeys?: boolean;
  scrubIpAddresses?: boolean;
  scrubCreditCards?: boolean;
  scrubSsn?: boolean;
  style?: RedactionStyle;
}

export interface DetectedEntity {
  category: "email" | "phone" | "apiKey" | "ipAddress" | "creditCard" | "ssn";
  rawValue: string;
  replacement: string;
  start: number;
  end: number;
}

export interface PrivacyScrubResult {
  sanitizedText: string;
  totalRedacted: number;
  stats: {
    emails: number;
    phones: number;
    apiKeys: number;
    ipAddresses: number;
    creditCards: number;
    ssn: number;
  };
  detectedEntities: DetectedEntity[];
}

// Regex patterns
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;

// International & US phone formats (e.g., +1-555-555-5555, (555) 555-5555, +44 20 7946 0958)
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

// Comprehensive API Keys & Secrets patterns
const OPENAI_KEY_REGEX = /\bsk-(?:proj-|live-|test-)?[A-Za-z0-9_-]{20,}\b/g;
const AWS_KEY_REGEX = /\bAKIA[0-9A-Z]{16}\b/g;
const GITHUB_TOKEN_REGEX = /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{82}\b/g;
const GOOGLE_API_KEY_REGEX = /\bAIza[0-9A-Za-z-_]{35}\b/g;
const SLACK_TOKEN_REGEX = /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g;
const JWT_TOKEN_REGEX = /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{10,}\b/g;
const GENERIC_SECRET_REGEX = /(?:api[_-]?key|secret|token|password|auth|bearer)\s*[:=]\s*["']?([A-Za-z0-9_\-.~+/=]{16,})["']?/gi;

// IP Addresses (IPv4 and IPv6)
const IPV4_REGEX = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
const IPV6_REGEX = /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b|\b(?:[0-9a-fA-F]{1,4}:){1,7}:(?::[0-9a-fA-F]{1,4}){1,7}\b/g;

// Credit Cards (13-19 digits, with spaces/dashes)
const CREDIT_CARD_REGEX = /\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{4}[-\s]?\d{6}[-\s]?\d{5}\b/g;

// US SSN
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;

function maskValue(val: string, category: DetectedEntity["category"]): string {
  if (category === "email") {
    const parts = val.split("@");
    if (parts.length === 2) {
      const name = parts[0];
      const domain = parts[1];
      const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
      return `${maskedName}@${domain}`;
    }
  }
  if (category === "phone") {
    return val.replace(/\d(?=\d{2})/g, "*");
  }
  if (category === "creditCard") {
    return val.replace(/\d(?=\d{4})/g, "*");
  }
  if (category === "ssn") {
    return "***-**-" + val.slice(-4);
  }
  if (category === "apiKey") {
    if (val.length > 8) {
      return val.slice(0, 4) + "***" + val.slice(-4);
    }
    return "********";
  }
  if (category === "ipAddress") {
    return val.replace(/\d+$/, "***");
  }
  return "[REDACTED]";
}

interface MatchCandidate {
  category: DetectedEntity["category"];
  start: number;
  end: number;
  raw: string;
}

/**
 * Scrubs PII and sensitive credentials from text 100% in memory
 */
export function scrubPrivacyText(
  inputText: string,
  options: PrivacyScrubOptions = {}
): PrivacyScrubResult {
  const {
    scrubEmails = true,
    scrubPhones = true,
    scrubApiKeys = true,
    scrubIpAddresses = true,
    scrubCreditCards = true,
    scrubSsn = true,
    style = "placeholder",
  } = options;

  if (!inputText) {
    return {
      sanitizedText: "",
      totalRedacted: 0,
      stats: { emails: 0, phones: 0, apiKeys: 0, ipAddresses: 0, creditCards: 0, ssn: 0 },
      detectedEntities: [],
    };
  }

  const matches: MatchCandidate[] = [];

  function collectMatches(regex: RegExp, category: DetectedEntity["category"], captureGroup = 0) {
    const r = new RegExp(regex.source, regex.flags);
    let match: RegExpExecArray | null;
    while ((match = r.exec(inputText)) !== null) {
      const raw = captureGroup > 0 && match[captureGroup] ? match[captureGroup] : match[0];
      const start = captureGroup > 0 && match[captureGroup]
        ? match.index + match[0].indexOf(match[captureGroup])
        : match.index;
      matches.push({
        category,
        start,
        end: start + raw.length,
        raw,
      });
    }
  }

  if (scrubEmails) {
    collectMatches(EMAIL_REGEX, "email");
  }

  if (scrubApiKeys) {
    collectMatches(OPENAI_KEY_REGEX, "apiKey");
    collectMatches(AWS_KEY_REGEX, "apiKey");
    collectMatches(GITHUB_TOKEN_REGEX, "apiKey");
    collectMatches(GOOGLE_API_KEY_REGEX, "apiKey");
    collectMatches(SLACK_TOKEN_REGEX, "apiKey");
    collectMatches(JWT_TOKEN_REGEX, "apiKey");
    collectMatches(GENERIC_SECRET_REGEX, "apiKey", 1);
  }

  if (scrubIpAddresses) {
    collectMatches(IPV4_REGEX, "ipAddress");
    collectMatches(IPV6_REGEX, "ipAddress");
  }

  if (scrubCreditCards) {
    collectMatches(CREDIT_CARD_REGEX, "creditCard");
  }

  if (scrubPhones) {
    collectMatches(PHONE_REGEX, "phone");
  }

  if (scrubSsn) {
    collectMatches(SSN_REGEX, "ssn");
  }

  // Sort matches by start position ascending, resolving overlapping matches by prioritizing longer matches
  matches.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (b.end - b.start) - (a.end - a.start);
  });

  const filteredMatches: MatchCandidate[] = [];
  let lastEnd = -1;

  for (const m of matches) {
    if (m.start >= lastEnd) {
      filteredMatches.push(m);
      lastEnd = m.end;
    }
  }

  // Consistent token mapping for placeholder mode (e.g., [EMAIL_1] stays [EMAIL_1])
  const tokenMaps = {
    email: new Map<string, string>(),
    phone: new Map<string, string>(),
    apiKey: new Map<string, string>(),
    ipAddress: new Map<string, string>(),
    creditCard: new Map<string, string>(),
    ssn: new Map<string, string>(),
  };

  const tokenLabels: Record<DetectedEntity["category"], string> = {
    email: "EMAIL",
    phone: "PHONE",
    apiKey: "API_KEY",
    ipAddress: "IP_ADDRESS",
    creditCard: "CREDIT_CARD",
    ssn: "SSN",
  };

  const detectedEntities: DetectedEntity[] = [];
  const stats = {
    emails: 0,
    phones: 0,
    apiKeys: 0,
    ipAddresses: 0,
    creditCards: 0,
    ssn: 0,
  };

  let sanitizedText = "";
  let currentIndex = 0;

  for (const m of filteredMatches) {
    // Add text preceding match
    sanitizedText += inputText.slice(currentIndex, m.start);

    // Determine replacement
    let replacement = "";
    if (style === "erase") {
      replacement = "";
    } else if (style === "generic") {
      replacement = `[REDACTED_${tokenLabels[m.category]}]`;
    } else if (style === "masked") {
      replacement = maskValue(m.raw, m.category);
    } else {
      // "placeholder" mode with consistent mapping
      const categoryMap = tokenMaps[m.category];
      if (!categoryMap.has(m.raw)) {
        const id = categoryMap.size + 1;
        categoryMap.set(m.raw, `[${tokenLabels[m.category]}_${id}]`);
      }
      replacement = categoryMap.get(m.raw)!;
    }

    sanitizedText += replacement;
    currentIndex = m.end;

    detectedEntities.push({
      category: m.category,
      rawValue: m.raw,
      replacement,
      start: m.start,
      end: m.end,
    });

    if (m.category === "email") stats.emails++;
    else if (m.category === "phone") stats.phones++;
    else if (m.category === "apiKey") stats.apiKeys++;
    else if (m.category === "ipAddress") stats.ipAddresses++;
    else if (m.category === "creditCard") stats.creditCards++;
    else if (m.category === "ssn") stats.ssn++;
  }

  // Add remaining trailing text
  sanitizedText += inputText.slice(currentIndex);

  return {
    sanitizedText,
    totalRedacted: detectedEntities.length,
    stats,
    detectedEntities,
  };
}
