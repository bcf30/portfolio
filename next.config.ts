import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages requires static export
  output: "export",
  // Base path - empty since we're deploying to /docs folder (served at /portfolio/)
  basePath: "",
  // Enable trailing slash for proper routing
  trailingSlash: true,
  // Disable strict mode for compatibility
  reactStrictMode: false,
};

export default nextConfig;
