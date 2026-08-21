import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'SnapBook Pro',
  description: 'Book verified professional photographers near you',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
