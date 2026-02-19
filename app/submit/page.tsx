'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const CATEGORIES = [
  { value: 'funny', label: '😊', emoji: '😊' },
  { value: 'scary', label: '😉', emoji: '😉' },
  { value: 'love', label: '❤️', emoji: '❤️' },
  { value: 'sad', label: '😢', emoji: '😢' },
  { value: 'inspiring', label: '✨', emoji: '✨' },
  { value: 'other', label: '📌', emoji: '📌' },
];

export default function SubmitPage() {
  const [category, setCategory] = useState('');
  const [story, setStory] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ id: string; submission_number?: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.MainButton?.hide();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (story.trim().length < 20) {
      setError('Story must be at least 20 characters.');
      return;
    }
    setLoading(true);
    try {
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData || '';
      const res = await fetch('/api/submit-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: story.trim(),
          category: category || null,
          anonymous,
          initData,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setDone({ id: data.id, submission_number: data.submission_number });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    const trackId = done.submission_number != null ? `#${done.submission_number}` : `#${done.id.slice(0, 8)}`;
    return (
      <main className="success-screen">
        <div className="success-icon">🎉</div>
        <h2 className="success-title">Story sent successfully!</h2>
        <p className="success-id">Your submission {trackId} — save this to track it.</p>
        <p className="success-text">We&apos;ll notify you if it&apos;s featured in a video.</p>
        <Link href="/" className="link-back" style={{ marginTop: 32 }}>
          ← Back to Home
        </Link>
      </main>
    );
  }

  return (
    <main className="page page-submit">
      <div className="page-header-row">
        <Link href="/" className="link-back">← Back</Link>
      </div>
      <h1 className="page-title">Submit Your Story!</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">How does it feel?</label>
          <div className="emoji-picker">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`emoji-btn ${category === c.value ? 'emoji-btn-active' : ''}`}
                onClick={() => setCategory(c.value)}
                title={c.value}
              >
                {c.emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Your Story</label>
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Type your story here..."
            rows={8}
            minLength={20}
            maxLength={4096}
            className="input-field"
            style={{ resize: 'vertical', minHeight: 180 }}
          />
          <span className="text-muted" style={{ fontSize: 12 }}>{story.length}/4096</span>
        </div>

        <label className="checkbox-label" style={{ marginBottom: 28 }}>
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
          />
          <span>Submit anonymously</span>
        </label>

        {error && (
          <p style={{ color: 'var(--error)', marginBottom: 20, fontSize: 14 }}>{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-primary btn-send">
          {loading ? 'Sending...' : 'Send to Leyu & Mahi'}
        </button>
      </form>
    </main>
  );
}
