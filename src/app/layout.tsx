import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Instagram Outreach OS | Vault Prospecting Engine',
  description: 'High-quality Instagram prospect discovery, qualification, and deterministic outreach OS for Vault (@vault.moment)',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-[#090a0f] text-gray-100 antialiased min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1 pb-16">
          {children}
        </main>
      </body>
    </html>
  );
}
