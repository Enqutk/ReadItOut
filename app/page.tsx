'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.MainButton?.hide();
    }
  }, []);

  return (
    <main className="home">
      <div className="home-hero">
        <div className="home-icon">✨</div>
        <h1 className="home-title">Welcome</h1>
        <p className="home-subtitle">
          Share your stories with Leyu & Mahi
        </p>
      </div>

      <div className="home-actions">
        <Link href="/submit" className="btn-primary">
          <span>📝</span> Submit a Story
        </Link>
        <Link href="/stories" className="btn-secondary">
          <span>📚</span> My Stories
        </Link>
        <Link href="/about" className="home-link-about">
          About
        </Link>
      </div>
    </main>
  );
}
