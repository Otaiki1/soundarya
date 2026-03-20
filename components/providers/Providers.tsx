"use client";

import React from "react";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";
import { config } from "@/lib/wagmi";
import { darkTheme } from "@rainbow-me/rainbowkit";

const queryClient = new QueryClient();

const customTheme = darkTheme({
    accentColor: "#C9A96E",
    accentColorForeground: "#0D0A07",
    borderRadius: "small",
    fontStack: "system",
    overlayBlur: "small",
});

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <QueryClientProvider client={queryClient}>
            <WagmiProvider config={config}>
                <RainbowKitProvider theme={customTheme}>
                    {children}
                </RainbowKitProvider>
            </WagmiProvider>
        </QueryClientProvider>
    );
}
