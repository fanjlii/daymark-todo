import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  output: "export",
  poweredByHeader: false,
  trailingSlash: true,
};

export default nextConfig;
