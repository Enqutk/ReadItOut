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

  const openDashboard = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : '/dashboard';
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.openLink) {
      tg.openLink(url);
    } else {
      window.open(url);
    }
  };

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
          <button type="button" onClick={openDashboard} className="btn-admin">
            <span>⚙️</span> Admin Dashboard
          </button>
        )}
      </div>
    </main>
  );
}
