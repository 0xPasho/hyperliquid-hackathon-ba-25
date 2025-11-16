import type { Metadata } from "next";
import { Geist, Geist_Mono, Special_Elite } from "next/font/google";
import "./globals.css";
import { PrivyProviderWrapper } from "@/providers/PrivyProviderWrapper";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const specialElite = Special_Elite({
    variable: "--font-special-elite",
    subsets: ["latin"],
    weight: "400",
});

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://degu.games'),
    title: {
        default: "Degu.Games - Play to Earn Blockchain Games",
        template: "%s | Degu.Games"
    },
    description: "Create, discover, and play blockchain games with real rewards. Build games with our no-code platform and compete in multiplayer tournaments.",
    keywords: ["blockchain games", "play to earn", "web3 gaming", "crypto games", "multiplayer games", "game creation platform", "no-code games"],
    authors: [{ name: "Degu.Games" }],
    creator: "Degu.Games",
    publisher: "Degu.Games",
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://degu.games",
        title: "Degu.Games - Play to Earn Blockchain Games",
        description: "Create, discover, and play blockchain games with real rewards. Build games with our no-code platform.",
        siteName: "Degu.Games",
        images: [
            {
                url: "/logo.png",
                width: 1200,
                height: 630,
                alt: "Degu.Games Logo",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Degu.Games - Play to Earn Blockchain Games",
        description: "Create, discover, and play blockchain games with real rewards.",
        images: ["/logo.png"],
    },
    icons: {
        icon: "/logo.png",
        shortcut: "/logo.png",
        apple: "/logo.png",
    },
    manifest: "/site.webmanifest",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} ${specialElite.variable} antialiased`}
            >
                <PrivyProviderWrapper>
                    <AuthProvider>{children}</AuthProvider>
                </PrivyProviderWrapper>
                <Toaster position="top-center" richColors closeButton />
            </body>
        </html>
    );
}
