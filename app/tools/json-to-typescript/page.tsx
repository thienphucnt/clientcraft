import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { JsonConverter } from "@/components/tools/JsonConverter";
import { EthicalAdCard } from "@/components/monetization/EthicalAdCard";
import { Code2, HelpCircle, ChevronRight, CheckCircle2, FileCode, Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Live JSON to TypeScript & Zod Schema Converter | ClientCraft",
  description:
    "Convert raw JSON to clean TypeScript interfaces and Zod validation schemas in real-time. 100% in-browser AST type inference with ISO date detection.",
  alternates: {
    canonical: "https://clientcraft.dev/tools/json-to-typescript",
  },
  openGraph: {
    title: "Live JSON to TypeScript & Zod Schema Converter — ClientCraft",
    description:
      "Instant dual-pane code generator converting JSON payloads to typed TypeScript models and Zod schemas in-memory.",
    url: "https://clientcraft.dev/tools/json-to-typescript",
    siteName: "ClientCraft",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "JSON to TypeScript & Zod Schema Generator (Client-Side)",
    description: "Generate recursive TypeScript interfaces and Zod validators in-memory with zero network telemetry.",
  },
};

const faqData = [
  {
    q: "How does the JSON to TypeScript converter handle nested objects?",
    a: "Our AST generator recursively traverses all object trees and extracts cleanly pascal-cased sub-interfaces (e.g. User, Address, OrderItem) so your generated types remain modular and reusable.",
  },
  {
    q: "Are Zod validation schemas synchronized with the TypeScript types?",
    a: "Yes! Every generated Zod schema exports an inferred type using z.infer<typeof Schema>, ensuring zero drift between your runtime validation and static compile-time typings.",
  },
  {
    q: "Is any part of my JSON payload transmitted to external servers?",
    a: "No. All parsing and code generation executes strictly inside your browser's V8 engine thread. Your proprietary API payloads and customer data remain 100% confidential.",
  },
  {
    q: "Can I detect ISO 8601 date strings?",
    a: "Yes, enabling the ISO Dates Detection toggle automatically annotates date strings with z.string().datetime() in Zod schemas.",
  },
];

export default function JsonToTypeScriptPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "ClientCraft JSON to TypeScript & Zod Converter",
        operatingSystem: "All",
        applicationCategory: "DeveloperApplication",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description:
          "Client-side dual-pane code editor converting raw JSON to structured TypeScript interfaces and Zod validation schemas.",
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

      <Header activeTab="json" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="hover:text-slate-900 dark:hover:text-white transition-colors">Tools</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-slate-900 dark:text-white">JSON to TypeScript &amp; Zod</span>
        </nav>

        {/* Hero SEO Header */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Code2 className="w-7 h-7 text-indigo-500 shrink-0" />
            <span>Live JSON to TypeScript &amp; Zod Schema Generator</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            Convert arbitrary JSON payloads into type-safe TypeScript interfaces and runtime Zod schemas. Instant AST parsing, custom root naming, and one-click clipboard copying.
          </p>
        </div>

        {/* Interactive Tool Component */}
        <section className="bg-white/90 dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs backdrop-blur-xs">
          <JsonConverter />
        </section>

        {/* Ethical Ad & Sponsor Placement */}
        <EthicalAdCard />

        {/* Technical Deep Dive & SEO Content */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FileCode className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Recursive In-Memory AST Normalization
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Our lightweight compiler resolves heterogeneous arrays, nullability unions (e.g. <code>string | null</code>), and deeply nested objects in linear time. Zero heavy external dependencies means instant keystroke response even on 10,000-line payloads.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Strict Runtime Validation with Zod
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              TypeScript interfaces disappear at compile time. ClientCraft simultaneously generates corresponding <code>zod</code> schemas so your Next.js Server Actions, tRPC routers, and API endpoints can validate untrusted user input with 100% type inference.
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
