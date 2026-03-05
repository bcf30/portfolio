import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages requires static export
  output: "export",
  // Base path for GitHub Pages (repo name is "portfolio")
  basePath: "/portfolio",
  // Asset prefix for GitHub Pages
  assetPrefix: "/portfolio",
  // Enable trailing slash for proper routing
  trailingSlash: true,
  // Disable strict mode for compatibility
  reactStrictMode: false,
};

export default nextConfig;
