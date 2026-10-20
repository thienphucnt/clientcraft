import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = isStaticExport
  ? {
      output: "export",
      basePath: "/vietlott-quantmatrix-pro",
      images: { unoptimized: true },
      turbopack: {
        rules: {
          "*.css": {
            loaders: ["@tailwindcss/turbopack"],
            as: "*.css",
          },
        },
      },
    }
  : {
      cacheComponents: true,
      partialPrefetching: true,
      turbopack: {
        rules: {
          "*.css": {
            loaders: ["@tailwindcss/turbopack"],
            as: "*.css",
          },
        },
      },
    };

export default nextConfig;
