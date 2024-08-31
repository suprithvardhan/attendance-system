// src/app/layout.tsx
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from 'next-themes';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Attendance System",
  description: "Facial recognition-based attendance system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow">
              <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold text-gray-800 dark:text-white">
                  Attendance System
                </Link>
                <ThemeToggle />
              </nav>
            </header>
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <footer className="bg-white dark:bg-gray-800 shadow">
              <div className="container mx-auto px-4 py-4 text-center text-gray-600 dark:text-gray-400">
                © 2023 Attendance System. All rights reserved.
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}