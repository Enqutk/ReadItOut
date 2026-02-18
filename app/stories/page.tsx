'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Story = {
  id: string;
  content: string;
  category: string | null;
  status: string;
  youtube_link: string | null;
  created_at: string;
};

export default function MyStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.MainButton?.hide();
    }
  }, []);

  useEffect(() => {
    const fetchStories = async () => {
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData || '';
      try {
        const res = await fetch(`/api/my-stories?initData=${encodeURIComponent(initData)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        setStories(data.stories || []);
      } catch (err: any) {
        setError(err.message || 'Could not load stories.');
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []);

  const statusLabel = (s: Story) => {
    if (s.status === 'featured' || s.youtube_link) return 'Featured 🌟';
    if (s.status === 'approved') return 'Approved';
    if (s.status === 'rejected') return 'Rejected';
    return 'Pending';
  };

  return (
    <main style={{ minHeight: '100vh', padding: 24 }}>
      <Link href="/" style={{ color: 'var(--tg-theme-link-color)', textDecoration: 'none', marginBottom: 24, display: 'inline-block' }}>
        ← Back
      </Link>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>My Stories</h1>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: '#f87171' }}>{error}</p>}

      {!loading && !error && stories.length === 0 && (
        <p style={{ color: 'var(--tg-theme-hint-color)' }}>No stories yet. Submit one from the home screen!</p>
      )}

      {!loading && stories.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {stories.map((s) => (
            <div
              key={s.id}
              style={{
                padding: 16,
                borderRadius: 12,
                background: 'var(--tg-theme-secondary-bg-color, #2d2d44)',
                border: '1px solid var(--tg-theme-hint-color, #333)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 600 }}>Story #{s.id.slice(0, 8)}</span>
                <span style={{ fontSize: 14, color: s.youtube_link ? '#a78bfa' : 'var(--tg-theme-hint-color)' }}>
                  {statusLabel(s)}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--tg-theme-hint-color)', lineHeight: 1.4 }}>
                {s.content.length > 120 ? s.content.slice(0, 120) + '...' : s.content}
              </p>
              {s.youtube_link && (
                <a
                  href={s.youtube_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-block', marginTop: 12, color: 'var(--tg-theme-link-color)', textDecoration: 'none', fontSize: 14 }}
                >
                  📺 Watch video
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
