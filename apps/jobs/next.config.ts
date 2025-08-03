import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@seeds/ui", "@seeds/tailwind", "@seeds/supabase"],
};

export default nextConfig;