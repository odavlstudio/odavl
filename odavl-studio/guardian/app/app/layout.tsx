import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ODAVL Guardian v3.0',
  description: 'Launch validation and pre-deploy testing for all project types',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
