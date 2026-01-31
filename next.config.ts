import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  // Disable dev overlay so it never touches localStorage (fixes crash when Node
  // is run with broken --localstorage-file, e.g. from Cursor).
  devIndicators: false,
};

export default nextConfig;
