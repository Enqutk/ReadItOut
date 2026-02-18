'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.MainButton?.hide();
      fetch(`/api/me?initData=${encodeURIComponent(tg.initData || '')}`)
        .then((r) => r.json())
        .then((data) => setIsAdmin(data.isAdmin === true))
        .catch(() => {});
    }
  }, []);

  return (
    <main className="home">
      <div className="home-hero">
        <div className="home-icon">✨</div>
        <h1 className="home-title">Submit Your Story!</h1>
        <p className="home-subtitle">
          Share your stories with Leyu & Mahi
        </p>
      </div>

      <div className="home-actions">
        <Link href="/submit" className="btn-primary">
          <span>✏️</span> Submit Story
        </Link>
        <Link href="/stories" className="btn-secondary">
          <span>📄</span> My Submissions
        </Link>
        <Link href="/about" className="btn-secondary">
          <span>❓</span> How It Works
        </Link>
        {isAdmin && (
          <Link href="/dashboard" className="btn-admin">
            <span>⚙️</span> Admin Dashboard
          </Link>
        )}
      </div>
    </main>
  );
}
