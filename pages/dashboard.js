import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (categoryFilter) params.set('category', categoryFilter);

    fetch(`/api/stories?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setStories(data.stories || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [statusFilter, categoryFilter]);

  const categories = [...new Set(stories.map((s) => s.category).filter(Boolean))];

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 900, margin: '0 auto' }}>
      <h1>Leyu & Mahi – Story Dashboard</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>
        View and manage fan stories. Use Telegram for approve/reject.
      </p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <label>
          Status:{' '}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '6px 12px' }}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <label>
          Category:{' '}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: '6px 12px' }}
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : stories.length === 0 ? (
        <p>No stories found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {stories.map((s) => (
            <div
              key={s.id}
              style={{
                border: '1px solid #eee',
                borderRadius: 8,
                padding: 16,
                backgroundColor: '#fafafa',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#666' }}>
                <span>
                  <code>{s.id.slice(0, 8)}</code> · {s.status} · {s.category || '—'}
                  {s.youtube_link && ' · 📺'}
                </span>
                <span>{new Date(s.created_at).toLocaleString()}</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>@{s.telegram_username || s.telegram_user_id}</strong>
              </div>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{s.content}</p>
              {s.rejection_reason && (
                <p style={{ marginTop: 8, color: '#c00', fontSize: 14 }}>Rejected: {s.rejection_reason}</p>
              )}
              {s.youtube_link && (
                <p style={{ marginTop: 8, fontSize: 14 }}>
                  <a href={s.youtube_link} target="_blank" rel="noopener noreferrer">📺 Watch video</a>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <p style={{ marginTop: 32, fontSize: 14, color: '#888' }}>
        <a href="/">← Back to home</a>
      </p>
    </div>
  );
}
