import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Next.js Sample for ODAVL',
  description: 'Testing Next.js detectors',
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
