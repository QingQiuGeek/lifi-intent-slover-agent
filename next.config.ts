import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      accounts: './empty-module.ts',
    },
  },
};

export default nextConfig;
