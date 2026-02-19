'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type Story = {
  id: string;
  submission_number?: number | null;
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
    if (s.status === 'featured' || s.youtube_link) return 'Featured';
    if (s.status === 'approved') return 'Approved';
    if (s.status === 'rejected') return 'Rejected';
    return 'Pending';
  };

  const badgeClass = (s: Story) => {
    if (s.youtube_link) return 'badge badge-featured';
    if (s.status === 'approved') return 'badge badge-approved';
    if (s.status === 'rejected') return 'badge badge-rejected';
    return 'badge badge-pending';
  };

  return (
    <main className="page">
      <Link href="/" className="link-back">← Back</Link>
      <h1 className="page-title">My Stories</h1>

      {loading && (
        <div className="empty-state">
          <div className="loading-spinner" />
          <p>Loading your stories...</p>
        </div>
      )}

      {error && (
        <p style={{ color: 'var(--error)', marginBottom: 20 }}>{error}</p>
      )}

      {!loading && !error && stories.length === 0 && (
        <div className="empty-state">
          <p style={{ fontSize: 48, marginBottom: 16 }}>📖</p>
          <p>No stories yet. Submit one from the home screen!</p>
          <Link href="/submit" className="btn-primary" style={{ marginTop: 24, maxWidth: 200 }}>
            Submit Story
          </Link>
        </div>
      )}

      {!loading && stories.length > 0 && (
        <div className="stories-list">
          {stories.map((s) => (
            <div key={s.id} className="story-card">
              <div className="story-header">
                <span className="story-id">Submission {s.submission_number != null ? `#${s.submission_number}` : `#${s.id.slice(0, 8)}`}</span>
                <span className={badgeClass(s)}>{statusLabel(s)}</span>
              </div>
              <p className="story-content">
                {s.content.length > 120 ? s.content.slice(0, 120) + '...' : s.content}
              </p>
              {s.youtube_link && (
                <a href={s.youtube_link} target="_blank" rel="noopener noreferrer" className="story-link">
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
