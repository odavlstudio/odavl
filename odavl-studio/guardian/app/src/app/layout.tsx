import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'ODAVL Guardian',
    description: 'Pre-deploy testing and post-deploy monitoring for ODAVL projects'
};

export default function RootLayout({
    children
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
