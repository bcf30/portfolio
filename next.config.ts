import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages requires static export
  output: "export",
  // Set base path for GitHub Pages subdirectory
  basePath: "/portfolio",
  // Add asset prefix for proper asset loading
  assetPrefix: "/portfolio",
  // Enable trailing slash for proper routing
  trailingSlash: true,
  // Disable strict mode for compatibility
  reactStrictMode: false,
};

export default nextConfig;
