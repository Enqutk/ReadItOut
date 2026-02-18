'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const SOCIAL_ICONS = { youtube: '▶️', instagram: '📷', tiktok: '🎵', twitter: '𝕏', discord: '💬' };

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});

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
    fetch('/api/app-config')
      .then((r) => r.json())
      .then((data) => setSocialLinks(data.socialLinks || {}))
      .catch(() => {});
  }, []);

  const links = Object.entries(socialLinks);

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
        {!isAdmin && (
          <>
            <Link href="/submit" className="btn-primary">
              <span>✏️</span> Submit Story
            </Link>
            <Link href="/stories" className="btn-secondary">
              <span>📄</span> My Submissions
            </Link>
          </>
        )}
        <Link href="/about" className="btn-secondary">
          <span>❓</span> How It Works
        </Link>
        {isAdmin && (
          <Link href="/dashboard" className="btn-admin">
            <span>⚙️</span> Admin Dashboard
          </Link>
        )}
      </div>

      {links.length > 0 && (
        <div className="home-social">
          <p className="home-social-label">Follow us</p>
          <div className="home-social-links">
            {links.map(([key, url]) => (
              <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="home-social-link" aria-label={key}>
                {SOCIAL_ICONS[key as keyof typeof SOCIAL_ICONS] || '🔗'}
              </a>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
