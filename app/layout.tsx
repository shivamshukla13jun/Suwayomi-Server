import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Suwayomi Manga Reader',
  description: 'Full-featured manga reader, library manager, and extension browser converted to TypeScript and Next.js.',
  openGraph: {
    title: 'Suwayomi Manga Reader',
    description: 'Full-featured manga reader, library manager, and extension browser converted to TypeScript and Next.js.',
  },
  icons: {
    icon: '/icons/faviconlogo.png',
    apple: '/icons/faviconlogo-128.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="/icons/faviconlogo.png" />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen select-none font-sans">
        {children}
      </body>
    </html>
  );
}
