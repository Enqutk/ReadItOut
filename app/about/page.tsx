'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const SOCIAL_ICONS = {
  youtube: '▶️',
  instagram: '📷',
  tiktok: '🎵',
  twitter: '𝕏',
  discord: '💬',
};

export default function AboutPage() {
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.MainButton?.hide();
    }
    fetch('/api/app-config')
      .then((r) => r.json())
      .then((data) => setSocialLinks(data.socialLinks || {}))
      .catch(() => {});
  }, []);

  const links = Object.entries(socialLinks);

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

      {links.length > 0 && (
        <div className="card social-links-card">
          <h3 className="social-links-title">Follow Leyu & Mahi</h3>
          <div className="social-links">
            {links.map(([key, url]) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                <span className="social-icon">{SOCIAL_ICONS[key as keyof typeof SOCIAL_ICONS] || '🔗'}</span>
                <span className="social-label">{key}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
