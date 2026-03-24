import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    experimental: {
        serverActions: { bodySizeLimit: "10mb" },
    },
    webpack: (config) => {
        config.resolve.alias = {
            ...(config.resolve.alias ?? {}),
            "@react-native-async-storage/async-storage": false,
        };

        return config;
    },
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "uploads.soundarya.ai" },
        ],
    },
    async headers() {
        return [
            {
                source: "/api/:path*",
                headers: [
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "X-Frame-Options", value: "DENY" },
                ],
            },
        ];
    },
};

export default nextConfig;
