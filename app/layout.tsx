import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
export const metadata: Metadata = {
  title: 'Princess & Chijioke | Invitation Studio',
  description:
    'Personal wedding invitations and guest entry passes for Princess and Chijioke.',
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
