import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "ODAVL Insight Cloud",
    description: "API-only ingest service",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
