"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  UploadCloud,
  Download,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Sliders,
  Check,
  Copy,
  Layers,
} from "lucide-react";
import {
  compressImage,
  formatBytes,
  CompressionOptions,
  CompressionResult,
} from "@/lib/tools/image-compressor";

export function ImageCompressor() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(75);
  const [maxWidth, setMaxWidth] = useState<number | undefined>(undefined);
  const [format, setFormat] = useState<CompressionOptions["format"]>("webp");
  const [keepAspectRatio] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const runCompression = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      try {
        const res = await compressImage(file, {
          quality: quality / 100,
          maxWidth: maxWidth || undefined,
          format,
          keepAspectRatio,
        });
        setResult(res);
      } catch (err) {
        console.error("Compression error:", err);
      } finally {
        setIsProcessing(false);
      }
    },
    [quality, maxWidth, format, keepAspectRatio]
  );

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (originalPreviewUrl) {
      URL.revokeObjectURL(originalPreviewUrl);
    }
    const url = URL.createObjectURL(file);
    setOriginalPreviewUrl(url);
    runCompression(file);
  };

  // Re-run compression when settings change if a file is loaded
  useEffect(() => {
    if (selectedFile) {
      const timer = setTimeout(() => {
        runCompression(selectedFile);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [quality, maxWidth, format, keepAspectRatio, selectedFile, runCompression]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/") || file.name.endsWith(".svg")) {
        handleFileSelect(file);
      }
    }
  };

  const handleDownload = () => {
    if (!result || !selectedFile) return;
    const a = document.createElement("a");
    a.href = result.previewUrl;
    const originalBase = selectedFile.name.replace(/\.[^/.]+$/, "");
    const ext = result.format === "svg" ? "svg" : result.format;
    a.download = `${originalBase}-optimized.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyDataUrl = async () => {
    if (!result) return;
    try {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          navigator.clipboard.writeText(reader.result);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      };
      reader.readAsDataURL(result.blob);
    } catch {
      // Ignore
    }
  };

  const loadSampleSvg = () => {
    const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <!-- Unnecessary editor metadata to demonstrate optimization -->
      <metadata id="metadata42"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description /></rdf:RDF></metadata>
      <defs>
        <linearGradient id="sampleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3b82f6" />
          <stop offset="50%" stop-color="#8b5cf6" />
          <stop offset="100%" stop-color="#ec4899" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" rx="32" fill="#0f172a" />
      <circle cx="400" cy="300" r="180" fill="url(#sampleGrad)" opacity="0.85" />
      <polygon points="400,160 520,380 280,380" fill="#ffffff" opacity="0.9" />
      <circle cx="400" cy="300" r="40" fill="#0f172a" />
    </svg>`;
    const blob = new Blob([sampleSvg], { type: "image/svg+xml" });
    const file = new File([blob], "vector-sample.svg", { type: "image/svg+xml" });
    handleFileSelect(file);
  };

  const loadSampleRaster = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 1920, 1080);
      grad.addColorStop(0, "#1e1b4b");
      grad.addColorStop(0.5, "#312e81");
      grad.addColorStop(1, "#0f172a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1920, 1080);

      for (let i = 0; i < 40; i++) {
        const x = Math.random() * 1920;
        const y = Math.random() * 1080;
        const r = 40 + Math.random() * 180;
        const circleGrad = ctx.createRadialGradient(x, y, 10, x, y, r);
        circleGrad.addColorStop(0, `hsla(${210 + i * 4}, 90%, 65%, 0.8)`);
        circleGrad.addColorStop(1, `hsla(${260 + i * 4}, 90%, 50%, 0)`);
        ctx.fillStyle = circleGrad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 64px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ClientCraft 100% In-Memory Canvas Engine", 960, 540);

      canvas.toBlob((b) => {
        if (b) {
          const file = new File([b], "sample-wallpaper.png", { type: "image/png" });
          handleFileSelect(file);
        }
      }, "image/png");
    }
  };

  return (
    <div className="space-y-6">
      {/* Tool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            SVG &amp; Raster Image Compressor
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browser-native Canvas &amp; OffscreenCanvas engine. Zero network requests, 100% local in-memory execution.
          </p>
        </div>

        {/* Quick Sample Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadSampleRaster}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Sample HD PNG
          </button>
          <button
            onClick={loadSampleSvg}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Sample SVG
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls, Right Preview & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
                : "border-slate-300 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-900/40"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif,image/bmp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />
            <div className="flex flex-col items-center gap-2.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {selectedFile ? selectedFile.name : "Drag & drop image here or click to browse"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Supports PNG, JPEG, WebP, and SVG vector files
                </p>
              </div>
            </div>
          </div>

          {/* Compression Configuration Card */}
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Compression Settings
                </span>
              </div>
              {isProcessing && (
                <div className="flex items-center gap-1.5 text-xs text-blue-500 font-medium animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </div>
              )}
            </div>

            {/* Quality Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">Compression Quality</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{quality}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
              />
              {/* Presets */}
              <div className="flex gap-1.5 pt-1">
                {[
                  { label: "Max Compression", val: 35 },
                  { label: "Balanced", val: 75 },
                  { label: "High Quality", val: 92 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setQuality(preset.val)}
                    className={`flex-1 text-[11px] py-1 rounded-lg border transition-all ${
                      quality === preset.val
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 font-semibold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Output Format */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Target Output Format</label>
              <div className="grid grid-cols-4 gap-2">
                {(["webp", "jpeg", "png", "original"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`py-1.5 text-xs font-semibold rounded-xl uppercase transition-all border ${
                      format === fmt
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Dimensions Slider / Preset Buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">Max Dimension Constraint</span>
                <span className="font-mono text-slate-500">
                  {maxWidth ? `${maxWidth}px Width` : "Original Dimensions"}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: "Original", val: undefined },
                  { label: "1080p", val: 1920 },
                  { label: "720p", val: 1280 },
                  { label: "800px", val: 800 },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setMaxWidth(item.val)}
                    className={`py-1 text-xs rounded-lg border transition-all ${
                      maxWidth === item.val
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 font-semibold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preview & Results Column */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="space-y-6">
              {/* Savings & Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Original Size</p>
                  <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {formatBytes(result.originalSize)}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Compressed Size</p>
                  <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatBytes(result.compressedSize)}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Size Reduction</p>
                  <p className="text-base font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                    -{result.savingsPercent.toFixed(1)}%
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">In-Memory Latency</p>
                  <p className="text-base font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
                    {result.processingTimeMs} ms
                  </p>
                </div>
              </div>

              {/* Visual Preview Box */}
              <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 overflow-hidden space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    Interactive Preview
                  </span>
                  <span className="font-mono">
                    {result.outputWidth} × {result.outputHeight} px ({result.format.toUpperCase()})
                  </span>
                </div>

                {/* Checkerboard Pattern Container for Transparency */}
                <div className="relative w-full h-80 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] bg-[size:16px_16px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.previewUrl}
                    alt="Optimized result"
                    className="max-h-full max-w-full object-contain drop-shadow-md"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyDataUrl}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? "Copied Data URI" : "Copy Data URI"}</span>
                    </button>
                  </div>

                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Compressed Image</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="h-full min-h-[380px] rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30 dark:bg-slate-900/20">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
                No Image Selected Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-6">
                Drag and drop any PNG, JPEG, WebP, or SVG file above or select one of the high-res instant samples to experience zero-lag client-side compression.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={loadSampleRaster}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
                >
                  Load 1080p Wallpaper
                </button>
                <button
                  onClick={loadSampleSvg}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
                >
                  Load Vector SVG
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
