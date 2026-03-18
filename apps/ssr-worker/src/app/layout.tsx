import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OpenNext Shop - SSR',
  description: 'Server-side rendered eCommerce pages',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
