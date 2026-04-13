import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export required for S3 deploy workflow.
  output: "export",
};

export default nextConfig;
