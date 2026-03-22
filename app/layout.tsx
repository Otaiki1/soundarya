import type { Metadata } from "next";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

export const metadata: Metadata = {
    title: "Soundarya — सौन्दर्य | Beauty Intelligence",
    description:
        "Ancient wisdom meets modern science. AI-powered facial analysis for harmony, symmetry, and attractiveness.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
