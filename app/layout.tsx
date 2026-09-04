import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
export const metadata: Metadata = {
  title: 'Princess & Chijioke | Our Wedding',
  description:
    'Join Princess and Chijioke as they celebrate their wedding on 18 December 2026 in Lagos.',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} antialiased`}>{children}</body>
    </html>
  );
}
