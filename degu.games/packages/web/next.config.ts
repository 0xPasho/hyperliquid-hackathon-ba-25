import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    eslint: {
        dirs: ["src"],
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.

        // PLEASE GET BACK THIS TO FALSE ONCE THE TEST BUILD IS UP
        ignoreDuringBuilds: true,
    },
    typescript: {
        // !! WARN !!
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors.
        // !! WARN !!

        /// PLEASE FOR GODSEIK REMOVE THIS
        ignoreBuildErrors: true,
    },
};

export default nextConfig;
