'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AboutPage() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.MainButton?.hide();
    }
  }, []);

  return (
    <main style={{ minHeight: '100vh', padding: 24 }}>
      <Link href="/" style={{ color: 'var(--tg-theme-link-color)', textDecoration: 'none', marginBottom: 24, display: 'inline-block' }}>
        ← Back
      </Link>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>About</h1>
      <p style={{ lineHeight: 1.6, color: 'var(--tg-theme-hint-color)' }}>
        Submit your stories to Leyu & Mahi. We read the best ones on our videos! 🎬
      </p>
      <p style={{ lineHeight: 1.6, color: 'var(--tg-theme-hint-color)' }}>
        We&apos;ll notify you when your story is featured. Thanks for being part of our community!
      </p>
    </main>
  );
}
