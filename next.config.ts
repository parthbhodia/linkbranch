import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The Wallet route reads these PNGs off disk to build the .pkpass bundle.
  // Nothing imports them, so tracing cannot infer the dependency and the files
  // would be absent from the serverless bundle -- which fails in production
  // only, at request time.
  outputFileTracingIncludes: {
    "/api/wallet/[username]": ["./assets/wallet/**"],
  },
};

export default nextConfig;
