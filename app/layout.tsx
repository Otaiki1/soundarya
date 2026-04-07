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
            <head>
                <meta name="talentapp:project_verification" content="5eda6aae08834f82d82304c6e572c98bfcb6bcf36e21a5051cc1f676de18e7098bc5ea1ab1701d586792a83328ee904f43ebd64efba69f769376e6bb00871b3c" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Josefin+Sans:wght@100..700&display=swap" rel="stylesheet" />
            </head>
            <body className="antialiased" suppressHydrationWarning>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
