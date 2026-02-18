'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const CATEGORIES = [
  { value: '', label: 'Choose a category...' },
  { value: 'funny', label: '😂 Funny' },
  { value: 'scary', label: '👻 Scary' },
  { value: 'love', label: '❤️ Love' },
  { value: 'sad', label: '😢 Sad' },
  { value: 'inspiring', label: '✨ Inspiring' },
  { value: 'other', label: '📌 Other' },
];

export default function SubmitPage() {
  const [category, setCategory] = useState('');
  const [story, setStory] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ id: string } | null>(null);
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
      setDone({ id: data.id });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    const shortId = done.id.slice(0, 8);
    return (
      <main className="success-screen">
        <div className="success-icon">🎉</div>
        <h2 className="success-title">Story sent successfully!</h2>
        <p className="success-id">Your story ID: #{shortId}</p>
        <p className="success-text">We&apos;ll notify you if it&apos;s featured in a video.</p>
        <Link href="/" className="link-back" style={{ marginTop: 32 }}>
          ← Back to Home
        </Link>
      </main>
    );
  }

  return (
    <main className="page">
      <Link href="/" className="link-back">← Back</Link>
      <h1 className="page-title">Submit a Story</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-select"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Your Story</label>
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Write your story here... (min 20 characters)"
            rows={8}
            minLength={20}
            maxLength={4096}
            className="input-field"
            style={{ resize: 'vertical', minHeight: 160 }}
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

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Sending...' : 'Submit Story'}
        </button>
      </form>
    </main>
  );
}
