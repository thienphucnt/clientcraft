"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertOctagon, RotateCcw, Copy, Check, ShieldAlert, Cpu } from "lucide-react";

interface Props {
  children: ReactNode;
  toolName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ClientCraft ErrorBoundary caught an exception:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  private copyDetails = async () => {
    if (!this.state.error) return;
    try {
      await navigator.clipboard.writeText(
        `Tool: ${this.props.toolName || "ClientCraft Tool"}\nError: ${this.state.error.message}\nStack: ${this.state.error.stack}`
      );
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // Ignore
    }
  };

  private categorizeError(msg: string): { title: string; hint: string; isOom: boolean } {
    const lower = msg.toLowerCase();

    if (
      lower.includes("out of memory") ||
      lower.includes("allocation") ||
      lower.includes("canvas") ||
      lower.includes("maximum allowed size") ||
      lower.includes("memory limit")
    ) {
      return {
        title: "Browser Memory Exhausted (Out-of-Memory)",
        hint: "Your browser's local memory ran low while rendering this image or buffer. Try selecting a smaller dimension constraint (e.g. 1080p or 800px) or lowering the quality slider.",
        isOom: true,
      };
    }

    if (lower.includes("chunk") || lower.includes("loading chunk")) {
      return {
        title: "Network Interruption (Chunk Load Failure)",
        hint: "A momentary offline drop interrupted asset streaming. ClientCraft is resilient and can resume immediately.",
        isOom: false,
      };
    }

    return {
      title: "Unexpected Client Execution Anomaly",
      hint: "An unhandled exception occurred in the browser's JavaScript runtime. Your data was not transmitted and remains strictly local.",
      isOom: false,
    };
  }

  public render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || "Unknown error";
      const { title, hint, isOom } = this.categorizeError(errorMsg);

      return (
        <div className="p-6 sm:p-8 rounded-3xl border border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20 space-y-5 animate-in fade-in duration-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              {isOom ? <Cpu className="w-6 h-6" /> : <AlertOctagon className="w-6 h-6" />}
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  {this.props.toolName || "Tool"} Anomaly
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                  Isolated Boundary
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                {hint}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto max-h-28 border border-slate-800">
            <code>{errorMsg}</code>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-rose-500/10">
            <div className="flex items-center gap-2">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recover &amp; Reset Tool</span>
              </button>

              <button
                onClick={this.copyDetails}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                {this.state.copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{this.state.copied ? "Copied" : "Copy Diagnostic Details"}</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
              <span>Zero telemetry sent to servers</span>
            </span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
