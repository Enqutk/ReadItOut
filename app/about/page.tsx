'use client';

import React, { useEffect } from 'react';
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
    <main className="page">
      <Link href="/" className="link-back">← Back</Link>
      <h1 className="page-title">About</h1>

      <div className="card" style={{ marginBottom: 24 }}>
        <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--text-muted)' }}>
          Submit your stories to Leyu & Mahi. We read the best ones on our videos! 🎬
        </p>
      </div>

      <div className="card">
        <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--text-muted)' }}>
          We&apos;ll notify you when your story is featured. Thanks for being part of our community! ✨
        </p>
      </div>
    </main>
  );
}
