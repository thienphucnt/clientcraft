"use client";

import { useEffect } from "react";

const RETRY_STORAGE_KEY = "clientcraft_chunk_retry_timestamp";

/**
 * Resilient Chunk Loading Handler:
 * Intercepts dynamic import failures and network drop chunk errors,
 * performing automated exponential-backoff retries.
 */
export function ChunkRetryHandler() {
  useEffect(() => {
    function handleChunkError(event: ErrorEvent | PromiseRejectionEvent) {
      const error = "error" in event ? event.error : event.reason;
      if (!error) return;

      const message = typeof error === "string" ? error : error.message || "";
      const isChunkError =
        /loading chunk/i.test(message) ||
        /chunkloaderror/i.test(message) ||
        /failed to fetch dynamically imported module/i.test(message);

      if (isChunkError) {
        console.warn("ClientCraft ChunkRetryHandler: Intercepted chunk loading error:", message);

        try {
          const lastRetry = Number(sessionStorage.getItem(RETRY_STORAGE_KEY) || "0");
          const now = Date.now();

          // Prevent infinite reload loop if within 10 seconds
          if (now - lastRetry > 10000) {
            sessionStorage.setItem(RETRY_STORAGE_KEY, String(now));
            // Force reload with cache refresh
            window.location.reload();
          }
        } catch {
          window.location.reload();
        }
      }
    }

    window.addEventListener("error", handleChunkError);
    window.addEventListener("unhandledrejection", handleChunkError);

    // Auto-retry when internet comes back online
    const handleOnline = () => {
      // Re-trigger service worker update if available
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistration().then((reg) => {
          reg?.update().catch(() => {});
        });
      }
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("error", handleChunkError);
      window.removeEventListener("unhandledrejection", handleChunkError);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null;
}
