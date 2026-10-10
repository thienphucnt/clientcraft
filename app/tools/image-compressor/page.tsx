import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { ImageCompressor } from "@/components/tools/ImageCompressor";
import { EthicalAdCard } from "@/components/monetization/EthicalAdCard";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Sparkles, Shield, Cpu, HelpCircle, ChevronRight, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Free Client-Side Image & SVG Compressor | 100% In-Memory Privacy",
  description:
    "Compress PNG, JPEG, WebP and minify SVG vectors locally in your browser. Zero network uploads, 100% private in-memory execution with offline PWA support.",
  alternates: {
    canonical: "https://clientcraft.dev/tools/image-compressor",
  },
  openGraph: {
    title: "Client-Side SVG & Raster Image Compressor — ClientCraft",
    description:
      "Compress PNG, JPEG, WebP, and SVG images with zero server uploads. Powered by HTML5 Canvas & Web Workers.",
    url: "https://clientcraft.dev/tools/image-compressor",
    siteName: "ClientCraft",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fast, Private Online Image Compressor (100% Client-Side)",
    description: "Compress images with zero network traffic. All rendering stays inside local browser memory.",
  },
};

const faqData = [
  {
    q: "Are my images uploaded to any remote server or cloud bucket?",
    a: "No. Never. Every pixel is processed locally in your browser's V8 JavaScript thread using HTML5 Canvas and OffscreenCanvas. No network requests are made.",
  },
  {
    q: "How does ClientCraft achieve high compression ratios?",
    a: "We use browser-native high-quality bicubic downsampling algorithms, progressive WebP encoding, and structural SVG XML optimization that strips redundant namespaces and comments.",
  },
  {
    q: "Does this image compressor work completely offline?",
    a: "Yes! ClientCraft is an installable Progressive Web App (PWA) with full service worker caching. You can disconnect your internet and compress as many images as you want.",
  },
  {
    q: "What image formats are supported?",
    a: "PNG, JPEG, JPG, WebP, SVG vector graphics, GIF, and BMP files are supported.",
  },
];

export default function ImageCompressorPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "ClientCraft Image & SVG Compressor",
        operatingSystem: "All",
        applicationCategory: "MultimediaApplication",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description:
          "High-performance client-side image and SVG compression utility operating 100% in local memory.",
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

      <Header activeTab="image" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="hover:text-slate-900 dark:hover:text-white transition-colors">Tools</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-slate-900 dark:text-white">Image &amp; SVG Compressor</span>
        </nav>

        {/* Hero SEO Header */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-blue-500 shrink-0" />
            <span>High-Performance In-Memory Image Compressor</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            Compress and convert PNG, JPEG, WebP images and SVG vectors with zero data transmission. Adjust compression quality and dimensions with real-time byte reduction metrics.
          </p>
        </div>

        {/* Interactive Tool Component wrapped with ErrorBoundary */}
        <section className="bg-white/90 dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs backdrop-blur-xs">
          <ErrorBoundary toolName="Image & SVG Compressor">
            <ImageCompressor />
          </ErrorBoundary>
        </section>

        {/* Ethical Ad & Sponsor Placement */}
        <EthicalAdCard />

        {/* Technical Deep Dive & SEO Content */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Hardware-Accelerated In-Browser Engine
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Unlike cloud services that transfer your confidential media files to third-party AWS S3 buckets or server fleets, ClientCraft harnesses your computer&apos;s GPU and browser HTML5 Canvas. We utilize <code>OffscreenCanvas</code> worker pipelines and bicubic downsampling algorithms directly on your local device.
            </p>
          </div>

          <div className="p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Zero-Trust Privacy Architecture
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Compliance-ready for medical, corporate, and proprietary assets. Because all calculations terminate within the browser sandbox, your company&apos;s trade secrets, unreleased marketing photography, and internal graphics never leave your workstation.
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
