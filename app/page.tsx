'use client';

import { useEffect } from 'react';
import Link from 'next/link';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        MainButton?: { hide: () => void };
      };
    };
  }
}

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
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 20,
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 8, textAlign: 'center' }}>
        Welcome 👋
      </h1>
      <p style={{ color: 'var(--tg-theme-hint-color, #888)', marginBottom: 32, textAlign: 'center' }}>
        Share your stories with Leyu & Mahi
      </p>

      <Link
        href="/submit"
        style={{
          display: 'block',
          width: '100%',
          maxWidth: 320,
          padding: '18px 24px',
          background: 'var(--tg-theme-button-color, #6366f1)',
          color: 'var(--tg-theme-button-text-color, #fff)',
          textAlign: 'center',
          borderRadius: 12,
          fontSize: 18,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Submit a Story
      </Link>

      <Link
        href="/stories"
        style={{
          display: 'block',
          width: '100%',
          maxWidth: 320,
          padding: '18px 24px',
          background: 'var(--tg-theme-secondary-bg-color, #2d2d44)',
          color: 'var(--tg-theme-text-color, #eee)',
          textAlign: 'center',
          borderRadius: 12,
          fontSize: 18,
          fontWeight: 600,
          textDecoration: 'none',
          border: '2px solid var(--tg-theme-button-color, #6366f1)',
        }}
      >
        My Stories
      </Link>

      <Link
        href="/about"
        style={{
          display: 'block',
          width: '100%',
          maxWidth: 320,
          padding: 14,
          color: 'var(--tg-theme-link-color, #818cf8)',
          textAlign: 'center',
          fontSize: 15,
          textDecoration: 'none',
        }}
      >
        About
      </Link>
    </main>
  );
}
