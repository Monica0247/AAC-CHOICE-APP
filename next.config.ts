import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A package-lock.json in the user home directory (outside this project)
  // otherwise makes Turbopack's root detection ambiguous.
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    serverActions: {
      // Card creation uploads a photo + an audio recording in one action.
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
