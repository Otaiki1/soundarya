import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    poweredByHeader: false,
    output: "standalone",
    experimental: {
        serverActions: { bodySizeLimit: "10mb" },
    },
    webpack: (config, { dev }) => {
        config.resolve.alias = {
            ...(config.resolve.alias ?? {}),
            "@react-native-async-storage/async-storage": false,
        };

        // Lit ships separate dev/prod builds via package `exports` conditions.
        // In production webpack still resolves the "development" condition for
        // browser targets, which triggers the "Lit is in dev mode" warning.
        // Removing that condition forces all Lit imports to the production build.
        if (!dev && Array.isArray(config.resolve.conditionNames)) {
            config.resolve.conditionNames = config.resolve.conditionNames.filter(
                (c: string) => c !== "development",
            );
        }

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
                source: "/:path*",
                headers: [
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "X-Frame-Options", value: "DENY" },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=()",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
