import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
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
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#fafafa] text-zinc-900 antialiased min-h-screen flex flex-col font-sans selection:bg-zinc-900 selection:text-white">
        <Navbar />
        <main className="flex-1 pb-16">
          {children}
        </main>
      </body>
    </html>
  );
}
