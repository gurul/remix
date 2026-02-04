import type { NextConfig } from "next";
import { execSync } from "child_process";

let lastCommitDate = "";
try {
  lastCommitDate = execSync("git log -1 --format=%cI", { encoding: "utf-8" }).trim();
} catch {
  // no git or not a repo
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_LAST_UPDATED: lastCommitDate,
  },
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
