import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OpenNext Shop',
  description: 'Modern eCommerce built with OpenNext and Cloudflare Workers',
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
