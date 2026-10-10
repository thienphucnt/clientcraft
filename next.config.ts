import type { NextConfig } from "next";

// Automatically prefix basePath and assetPrefix for GitHub Pages subpath (/clientcraft).
// For Vercel or custom domain hosting, basePath remains empty ("").
const isGithubPages =
  process.env.GITHUB_PAGES === "true" ||
  Boolean(process.env.GITHUB_ACTIONS && !process.env.VERCEL && process.env.GITHUB_WORKFLOW === "Deploy to GitHub Pages");

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || (isGithubPages ? "/clientcraft" : "");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
