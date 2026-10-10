import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { PrivacyScrubber } from "@/components/tools/PrivacyScrubber";
import { EthicalAdCard } from "@/components/monetization/EthicalAdCard";
import { ShieldAlert, HelpCircle, ChevronRight, CheckCircle2, Lock, Terminal } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Prompt Privacy & PII Scrubber | Strip API Keys & Emails Locally",
  description:
    "Strip API keys, AWS credentials, JWT tokens, emails, phone numbers, and IP addresses before pasting text into OpenAI, Claude, or Gemini. 100% client-side memory execution.",
  alternates: {
    canonical: "https://clientcraft.dev/tools/text-privacy-scrubber",
  },
  openGraph: {
    title: "AI Prompt Privacy Scrubber & PII Redactor — ClientCraft",
    description:
      "Sanitize sensitive cloud credentials, API tokens, and PII in-memory before sending prompts to external AI models.",
    url: "https://clientcraft.dev/tools/text-privacy-scrubber",
    siteName: "ClientCraft",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Prompt PII & Credential Scrubber (100% In-Memory)",
    description: "Protect company credentials and client PII before submitting queries to LLMs.",
  },
};

const faqData = [
  {
    q: "Why do I need to scrub text before pasting into AI models?",
    a: "Commercial AI providers (such as OpenAI, Anthropic, or Google) may retain user queries for model training, monitoring, or human review. Pasting raw API keys, production database IPs, or customer PII introduces severe security and compliance liabilities (GDPR, HIPAA, SOC 2).",
  },
  {
    q: "How does Tokenized Placeholder redaction preserve prompt context?",
    a: "Instead of completely deleting the secret, Tokenized mode replaces it with a consistent identifier like [API_KEY_1] or [EMAIL_1]. If the same email appears multiple times in your log trace, it always receives the exact same placeholder so the AI model understands relationships and variable flow.",
  },
  {
    q: "Can this scrubber detect both IPv4 and IPv6 addresses?",
    a: "Yes! The regex engine matches both standard IPv4 dot-decimal addresses and compressed IPv6 colon-hexadecimal addresses.",
  },
  {
    q: "Are my confidential prompts or stripped keys saved in any database?",
    a: "No. The scrubber runs 100% client-side in browser memory. Nothing is ever saved to disk or transmitted across the wire.",
  },
];

export default function TextPrivacyScrubberPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "ClientCraft AI Prompt Privacy Scrubber",
        operatingSystem: "All",
        applicationCategory: "SecurityApplication",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description:
          "Client-side regex redaction engine stripping sensitive credentials, tokens, emails, and PII from AI prompts.",
      },
      {
        "@type": "FAQPage",
        mainEntity: faqData.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a,
          },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Header activeTab="scrubber" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="hover:text-slate-900 dark:hover:text-white transition-colors">Tools</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-slate-900 dark:text-white">Text Privacy Scrubber</span>
        </nav>

        {/* Hero SEO Header */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-emerald-500 shrink-0" />
            <span>AI Prompt Sanitizer &amp; PII Credential Scrubber</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            Protect proprietary tokens, cloud access keys, customer emails, and server IPs before submitting logs or queries to external AI models. Zero network transmission.
          </p>
        </div>

        {/* Interactive Tool Component */}
        <section className="bg-white/90 dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs backdrop-blur-xs">
          <PrivacyScrubber />
        </section>

        {/* Ethical Ad & Sponsor Placement */}
        <EthicalAdCard />

        {/* Technical Deep Dive & SEO Content */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Prevent LLM Data Leakage
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Engineers frequently paste stack traces, configuration files, and database queries into AI chat interfaces. Accidental exposure of an AWS secret key or database endpoint can compromise enterprise infrastructure. Our client-side regex pipeline intercepts these values before they touch the network.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Context-Preserving Token Mapping
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Generic erasure breaks code logic and LLM comprehension. By replacing distinct sensitive entities with numbered tokens (e.g., <code>[API_KEY_1]</code>, <code>[IP_ADDRESS_2]</code>), external models can still accurately debug logic flaws and write refactored code without seeing the true secret.
            </p>
          </div>
        </section>

        {/* Structured FAQ Section matching JSON-LD */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqData.map((faq, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/40 dark:bg-slate-900/30 space-y-1.5"
              >
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
