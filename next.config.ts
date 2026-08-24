import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This deployable app has its own lockfile and dependencies inside a larger
  // workspace. Pinning the root prevents Turbopack from following the parent
  // workspace's external node_modules junction.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
