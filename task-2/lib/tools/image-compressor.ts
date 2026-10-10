export interface CompressionOptions {
  quality: number; // 0.01 to 1.0
  maxWidth?: number;
  maxHeight?: number;
  format: "webp" | "jpeg" | "png" | "original";
  keepAspectRatio?: boolean;
}

export interface CompressionResult {
  blob: Blob;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  savingsBytes: number;
  savingsPercent: number;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
  mimeType: string;
  format: string;
  processingTimeMs: number;
  isSvg: boolean;
}

/**
 * Minifies and cleans raw SVG XML by stripping comments, redundant namespaces,
 * metadata, and collapsing whitespace locally in memory.
 */
export function optimizeSvgString(svgText: string): string {
  let cleaned = svgText;

  // Remove XML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, "");

  // Remove XML declaration and DOCTYPE
  cleaned = cleaned.replace(/<\?xml[\s\S]*?\?>/gi, "");
  cleaned = cleaned.replace(/<!DOCTYPE[\s\S]*?>/gi, "");

  // Remove <metadata>...</metadata>
  cleaned = cleaned.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");

  // Remove editor-specific attributes and namespaces (e.g., inkscape, sodipodi)
  cleaned = cleaned.replace(/\s+(xmlns:inkscape|xmlns:sodipodi|xmlns:dc|xmlns:cc|xmlns:rdf)="[^"]*"/gi, "");
  cleaned = cleaned.replace(/\s+(inkscape:[a-z0-9_-]+|sodipodi:[a-z0-9_-]+)="[^"]*"/gi, "");

  // Remove empty groups <g></g> or <g id="..." />
  cleaned = cleaned.replace(/<g[^>]*>\s*<\/g>/gi, "");

  // Collapse consecutive whitespaces and clean line breaks
  cleaned = cleaned.replace(/\s{2,}/g, " ");
  cleaned = cleaned.replace(/>\s+</g, "><");
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Calculates new dimensions based on max width/height while maintaining aspect ratio
 */
export function calculateAspectRatioFit(
  srcWidth: number,
  srcHeight: number,
  maxWidth?: number,
  maxHeight?: number
): { width: number; height: number } {
  let width = srcWidth;
  let height = srcHeight;

  if (maxWidth && width > maxWidth) {
    const ratio = maxWidth / width;
    width = maxWidth;
    height = Math.round(height * ratio);
  }

  if (maxHeight && height > maxHeight) {
    const ratio = maxHeight / height;
    height = maxHeight;
    width = Math.round(width * ratio);
  }

  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
}

/**
 * Compresses an image file (raster or SVG) 100% client-side in memory.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions
): Promise<CompressionResult> {
  const startTime = performance.now();
  const originalSize = file.size;
  const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");

  // Handle SVG directly if format is original
  if (isSvg && (options.format === "original" || !options.format)) {
    const rawSvg = await file.text();
    const minifiedSvg = optimizeSvgString(rawSvg);
    const blob = new Blob([minifiedSvg], { type: "image/svg+xml" });
    const compressedSize = blob.size;
    const savingsBytes = Math.max(0, originalSize - compressedSize);
    const savingsPercent = originalSize > 0 ? (savingsBytes / originalSize) * 100 : 0;
    const previewUrl = URL.createObjectURL(blob);

    // Parse dimensions from SVG or default to 0
    let width = 0;
    let height = 0;
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawSvg, "image/svg+xml");
    const svgEl = doc.querySelector("svg");
    if (svgEl) {
      width = parseFloat(svgEl.getAttribute("width") || "0") || 800;
      height = parseFloat(svgEl.getAttribute("height") || "0") || 600;
      if (width === 800 && height === 600) {
        const viewBox = svgEl.getAttribute("viewBox");
        if (viewBox) {
          const parts = viewBox.split(/[\s,]+/).map(Number);
          if (parts.length >= 4) {
            width = parts[2];
            height = parts[3];
          }
        }
      }
    }

    return {
      blob,
      previewUrl,
      originalSize,
      compressedSize,
      savingsBytes,
      savingsPercent,
      originalWidth: width,
      originalHeight: height,
      outputWidth: width,
      outputHeight: height,
      mimeType: "image/svg+xml",
      format: "svg",
      processingTimeMs: Math.round(performance.now() - startTime),
      isSvg: true,
    };
  }

  // Handle Raster (or SVG converted to Raster)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Failed to read image file."));

    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to parse image for canvas rendering."));

      img.onload = async () => {
        const origWidth = img.naturalWidth || img.width;
        const origHeight = img.naturalHeight || img.height;

        const { width: targetWidth, height: targetHeight } = calculateAspectRatioFit(
          origWidth,
          origHeight,
          options.maxWidth,
          options.maxHeight
        );

        // Determine destination MIME type
        let targetMime = "image/webp";
        let outFormat = "webp";

        if (options.format === "jpeg") {
          targetMime = "image/jpeg";
          outFormat = "jpeg";
        } else if (options.format === "png") {
          targetMime = "image/png";
          outFormat = "png";
        } else if (options.format === "original") {
          if (file.type === "image/png") {
            targetMime = "image/png";
            outFormat = "png";
          } else if (file.type === "image/jpeg" || file.type === "image/jpg") {
            targetMime = "image/jpeg";
            outFormat = "jpeg";
          } else {
            targetMime = "image/webp";
            outFormat = "webp";
          }
        }

        // Try OffscreenCanvas if supported for background canvas execution
        let blob: Blob | null = null;

        if (typeof OffscreenCanvas !== "undefined") {
          try {
            const offscreen = new OffscreenCanvas(targetWidth, targetHeight);
            const ctx = offscreen.getContext("2d");
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = "high";

              // White background for JPEG if transparency
              if (targetMime === "image/jpeg") {
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, targetWidth, targetHeight);
              }

              ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
              blob = await offscreen.convertToBlob({
                type: targetMime,
                quality: options.quality,
              });
            }
          } catch {
            // Fallback to standard canvas below
            blob = null;
          }
        }

        // Fallback to standard DOM Canvas if needed
        if (!blob) {
          const canvas = document.createElement("canvas");
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Unable to create canvas context"));
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          if (targetMime === "image/jpeg") {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, targetWidth, targetHeight);
          }

          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          blob = await new Promise<Blob>((resBlob, rejBlob) => {
            canvas.toBlob(
              (b) => {
                if (b) resBlob(b);
                else rejBlob(new Error("Canvas blob conversion failed."));
              },
              targetMime,
              options.quality
            );
          });
        }

        const compressedSize = blob.size;
        const savingsBytes = Math.max(0, originalSize - compressedSize);
        const savingsPercent = originalSize > 0 ? (savingsBytes / originalSize) * 100 : 0;
        const previewUrl = URL.createObjectURL(blob);
        const processingTimeMs = Math.round(performance.now() - startTime);

        resolve({
          blob,
          previewUrl,
          originalSize,
          compressedSize,
          savingsBytes,
          savingsPercent,
          originalWidth: origWidth,
          originalHeight: origHeight,
          outputWidth: targetWidth,
          outputHeight: targetHeight,
          mimeType: targetMime,
          format: outFormat,
          processingTimeMs,
          isSvg: false,
        });
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes into human readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
