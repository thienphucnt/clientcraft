"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Copy,
  Check,
  Download,
  Key,
  Mail,
  Phone,
  Globe,
  CreditCard,
  FileText,
  Trash2,
  Eye,
} from "lucide-react";
import {
  scrubPrivacyText,
  RedactionStyle,
} from "@/lib/tools/privacy-scrubber";

const SAMPLE_PROMPTS = {
  apiDebug: `Error occurred during production sync in AWS Lambda handler.
Trace details:
- Triggered by user: alex.dev@enterprise-cloud.io (cell: +1-415-555-0198)
- Server IP: 198.51.100.42 contacting internal cluster at 10.0.4.12
- AWS Access Key ID: AKIAIOSFODNN7EXAMPLE
- OpenAI API Key: sk-proj-abC123def456GHI789jkl012MNO345pqr678STU901vwx
- GitHub Personal Token: ghp_111122223333444455556666777788889999

Please help me write an async TypeScript wrapper to retry this request with exponential backoff.`,

  customerSupport: `Customer Ticket #884102:
Customer Name: Samantha Miller
Email: smiller.work@fintech-solutions.org
Contact Number: (555) 382-9910
Billing Account Number / Card: 4532-8812-9901-4421
Social Security Reference: 123-45-6789
Client IP Address: 203.0.113.195

Customer claims their automated subscription was renewed twice. Please generate a polite, professional support apology email and refund confirmation.`,

  clusterCrash: `Kubernetes pod crash dump:
Auth Header: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
Database Host: 172.16.254.1
Alert sent to: devops-oncall@hyperscale.net and secondary: sysadmin@core-infra.tech
Emergency Hotline: +44 20 7946 0958

Analyze root cause and summarize in bullet points for executive team.`,
};

export function PrivacyScrubber() {
  const [inputText, setInputText] = useState<string>(SAMPLE_PROMPTS.apiDebug);
  const [style, setStyle] = useState<RedactionStyle>("placeholder");
  const [scrubEmails, setScrubEmails] = useState<boolean>(true);
  const [scrubPhones, setScrubPhones] = useState<boolean>(true);
  const [scrubApiKeys, setScrubApiKeys] = useState<boolean>(true);
  const [scrubIpAddresses, setScrubIpAddresses] = useState<boolean>(true);
  const [scrubCreditCards, setScrubCreditCards] = useState<boolean>(true);
  const [scrubSsn, setScrubSsn] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [showEntityList, setShowEntityList] = useState<boolean>(false);

  const result = useMemo(() => {
    return scrubPrivacyText(inputText, {
      style,
      scrubEmails,
      scrubPhones,
      scrubApiKeys,
      scrubIpAddresses,
      scrubCreditCards,
      scrubSsn,
    });
  }, [
    inputText,
    style,
    scrubEmails,
    scrubPhones,
    scrubApiKeys,
    scrubIpAddresses,
    scrubCreditCards,
    scrubSsn,
  ]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.sanitizedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleDownload = () => {
    const blob = new Blob([result.sanitizedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sanitized-prompt.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-500" />
            AI Prompt Privacy &amp; PII Scrubber
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Redacts API keys, credentials, emails, and identifiers before submitting queries to external AI models.
          </p>
        </div>

        {/* Preset Sample Prompts */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Samples:</span>
          <button
            onClick={() => setInputText(SAMPLE_PROMPTS.apiDebug)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition-colors"
          >
            API &amp; Cloud Keys
          </button>
          <button
            onClick={() => setInputText(SAMPLE_PROMPTS.customerSupport)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Customer PII &amp; Cards
          </button>
          <button
            onClick={() => setInputText(SAMPLE_PROMPTS.clusterCrash)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Kubernetes JWT &amp; IPs
          </button>
        </div>
      </div>

      {/* Control Ribbon: Redaction Modes and Entity Toggles */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Redaction Style Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Scrub Mode:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {[
                { id: "placeholder", label: "Tokenized [KEY_1]" },
                { id: "generic", label: "Generic [REDACTED]" },
                { id: "masked", label: "Masked (j***@d)" },
                { id: "erase", label: "Erase Completely" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setStyle(m.id as RedactionStyle)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    style === m.id
                      ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xs font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Inspector Toggle */}
          <button
            onClick={() => setShowEntityList(!showEntityList)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-blue-500" />
            <span>{showEntityList ? "Hide Entity Inspector" : `Inspect Entities (${result.totalRedacted})`}</span>
          </button>
        </div>

        {/* Entity Toggles Checkboxes */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-700 dark:text-slate-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={scrubApiKeys}
              onChange={(e) => setScrubApiKeys(e.target.checked)}
              className="rounded-sm accent-emerald-600 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <Key className="w-3 h-3 text-amber-500" /> API Keys / JWTs
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={scrubEmails}
              onChange={(e) => setScrubEmails(e.target.checked)}
              className="rounded-sm accent-emerald-600 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-blue-500" /> Emails
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={scrubIpAddresses}
              onChange={(e) => setScrubIpAddresses(e.target.checked)}
              className="rounded-sm accent-emerald-600 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-purple-500" /> IP Addresses
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={scrubPhones}
              onChange={(e) => setScrubPhones(e.target.checked)}
              className="rounded-sm accent-emerald-600 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-green-500" /> Phone Numbers
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={scrubCreditCards}
              onChange={(e) => setScrubCreditCards(e.target.checked)}
              className="rounded-sm accent-emerald-600 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-rose-500" /> Cards &amp; Numbers
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={scrubSsn}
              onChange={(e) => setScrubSsn(e.target.checked)}
              className="rounded-sm accent-emerald-600 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-indigo-500" /> SSN Identifiers
            </span>
          </label>
        </div>
      </div>

      {/* Stats Counter Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Redacted</p>
          <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
            {result.totalRedacted}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">API Keys / JWT</p>
          <p className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
            {result.stats.apiKeys}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Emails</p>
          <p className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
            {result.stats.emails}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">IP Addresses</p>
          <p className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400 mt-0.5">
            {result.stats.ipAddresses}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Phones</p>
          <p className="text-lg font-bold font-mono text-green-600 dark:text-green-400 mt-0.5">
            {result.stats.phones}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Financial / SSN</p>
          <p className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
            {result.stats.creditCards + result.stats.ssn}
          </p>
        </div>
      </div>

      {/* Entity Inspector Drawer if enabled */}
      {showEntityList && result.detectedEntities.length > 0 && (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Detected Sensitive Entities Breakdown
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {result.detectedEntities.length} items scrubbed
            </span>
          </div>
          <div className="max-h-56 overflow-y-auto pt-2 space-y-1.5">
            {result.detectedEntities.map((ent, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-4 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs font-mono"
              >
                <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
                  <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold rounded-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {ent.category}
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 truncate max-w-xs line-through opacity-75">
                    {ent.rawValue}
                  </span>
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                  → {ent.replacement}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dual Pane Editors: Left Original, Right Sanitized */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Raw Prompt Input */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Raw Text / Sensitive Input
            </span>
            <button
              onClick={() => setInputText("")}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          <div className="relative min-h-[360px] flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 shadow-inner">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste text with credentials, emails, or PII here..."
              className="w-full h-full font-mono text-xs leading-relaxed bg-transparent resize-none focus:outline-hidden text-slate-800 dark:text-slate-200 min-h-[320px]"
            />
          </div>
        </div>

        {/* Right: Sanitized AI-Ready Output */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Sanitized Output (Ready for AI Model)</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3.5 py-1 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-500/20 transition-all active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied Sanitized" : "Copy for AI"}</span>
              </button>
            </div>
          </div>

          <div className="relative min-h-[360px] flex-1 rounded-2xl border border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-950/10 dark:bg-emerald-950/20 p-4 shadow-inner">
            <textarea
              readOnly
              value={result.sanitizedText}
              placeholder="Scrubbed output will appear here instantly..."
              className="w-full h-full font-mono text-xs leading-relaxed bg-transparent resize-none focus:outline-hidden text-emerald-700 dark:text-emerald-300 min-h-[320px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
