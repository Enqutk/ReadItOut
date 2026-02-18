'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CATEGORIES = [
  { value: '', label: 'Choose...' },
  { value: 'funny', label: 'Funny' },
  { value: 'scary', label: 'Scary' },
  { value: 'love', label: 'Love' },
  { value: 'sad', label: 'Sad' },
  { value: 'inspiring', label: 'Inspiring' },
  { value: 'other', label: 'Other' },
];

export default function SubmitPage() {
  const router = useRouter();
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
      <main style={{ minHeight: '100vh', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Story sent successfully!</h2>
          <p style={{ color: 'var(--tg-theme-hint-color)', marginBottom: 24 }}>
            Your story ID: <strong>#{shortId}</strong>
          </p>
          <p style={{ color: 'var(--tg-theme-hint-color)', fontSize: 14 }}>
            We&apos;ll notify you if it&apos;s featured in a video.
          </p>
          <Link href="/" style={{ display: 'inline-block', marginTop: 32, color: 'var(--tg-theme-link-color)', textDecoration: 'none' }}>
            ← Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: 24 }}>
      <Link href="/" style={{ color: 'var(--tg-theme-link-color)', textDecoration: 'none', marginBottom: 24, display: 'inline-block' }}>
        ← Back
      </Link>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>Submit a Story</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span>Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: 16,
              borderRadius: 12,
              background: 'var(--tg-theme-secondary-bg-color, #2d2d44)',
              color: 'inherit',
              border: '1px solid var(--tg-theme-hint-color, #555)',
              fontSize: 16,
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span>Your Story</span>
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Write your story here... (min 20 characters)"
            rows={8}
            minLength={20}
            maxLength={4096}
            style={{
              padding: 16,
              borderRadius: 12,
              background: 'var(--tg-theme-secondary-bg-color, #2d2d44)',
              color: 'inherit',
              border: '1px solid var(--tg-theme-hint-color, #555)',
              fontSize: 16,
              resize: 'vertical',
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--tg-theme-hint-color)' }}>{story.length}/4096</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            style={{ width: 20, height: 20 }}
          />
          <span>Submit anonymously</span>
        </label>

        {error && <p style={{ color: '#f87171' }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 18,
            borderRadius: 12,
            background: 'var(--tg-theme-button-color, #6366f1)',
            color: 'var(--tg-theme-button-text-color, #fff)',
            fontSize: 18,
            fontWeight: 600,
            border: 'none',
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Sending...' : 'Submit Story'}
        </button>
      </form>
    </main>
  );
}
