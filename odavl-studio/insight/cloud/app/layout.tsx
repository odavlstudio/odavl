import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";

export const metadata: Metadata = {
    title: "ODAVL Insight Cloud",
    description: "Global Intelligence Dashboard for ODAVL Projects",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                <AuthProvider>
                    <header className="bg-primary-600 text-white p-4 shadow-md">
                        <div className="container mx-auto">
                            <h1 className="text-2xl font-bold">ODAVL Insight Cloud</h1>
                            <p className="text-sm">Global Intelligence Dashboard</p>
                        </div>
                    </header>
                    <main className="container mx-auto p-6">{children}</main>
                    <footer className="bg-gray-100 dark:bg-gray-800 p-4 mt-8">
                        <div className="container mx-auto text-center text-sm text-gray-600 dark:text-gray-400">
                            © 2025 ODAVL Insight Cloud — Powered by Next.js 15
                        </div>
                    </footer>
                </AuthProvider>
            </body>
        </html>
    );
}
