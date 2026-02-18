import React from 'react';
import type { Metadata } from 'next';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import './globals.css';

const Popup = dynamic(() => import('./components/Popup'), { ssr: false });

export const metadata: Metadata = {
  title: 'Leyu & Mahi',
  description: 'Submit your fan stories',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        {children}
        <Popup />
      </body>
    </html>
  );
}
