import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Allow network access to dev server from 192.168.1.97 */
  allowedDevOrigins: ["192.168.1.97"],
};

export default nextConfig;
