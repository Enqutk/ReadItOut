import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Dashboard() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [youtubeLink, setYoutubeLink] = useState('');
  const [linking, setLinking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const selectFilter = (id) => {
    setActiveFilter(id);
    setSidebarOpen(false);
  };

  useEffect(() => {
    setLoading(true);
    fetch('/api/stories')
      .then((r) => r.json())
      .then((data) => {
        setStories(data.stories || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const counts = { pending: 0, approved: 0, rejected: 0 };
  stories.forEach((s) => {
    if (counts[s.status] !== undefined) counts[s.status]++;
  });
  const featuredCount = stories.filter((s) => s.youtube_link).length;
  const newCount = stories.filter((s) => s.status === 'pending' && !s.read_at).length;
  const categories = [...new Set(stories.map((s) => s.category).filter(Boolean))];

  const sidebarItems = [
    { id: 'all', label: 'All Stories', count: stories.length },
    { id: 'pending', label: 'New', count: newCount },
    { id: 'approved', label: 'Shortlisted', count: counts.approved },
    { id: 'rejected', label: 'Rejected', count: counts.rejected },
    { id: 'featured', label: 'Featured', count: featuredCount },
  ];

  const byCategory = (list) =>
    !categoryFilter ? list : list.filter((s) => s.category === categoryFilter);
  const bySearch = (list) => {
    if (!searchFilter.trim()) return list;
    const q = searchFilter.trim().toLowerCase();
    return list.filter(
      (s) =>
        (s.content && s.content.toLowerCase().includes(q)) ||
        (s.telegram_username && s.telegram_username.toLowerCase().includes(q))
    );
  };

  const newStories = bySearch(byCategory(stories.filter((s) => s.status === 'pending' && !s.read_at)));
  const shortlisted = bySearch(byCategory(stories.filter((s) => s.status === 'approved')));
  const featured = bySearch(byCategory(stories.filter((s) => s.youtube_link)));

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFeatureVideo = async () => {
    if (selectedIds.size === 0 || !youtubeLink.trim()) return;
    setLinking(true);
    try {
      const res = await fetch('/api/admin/feature-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyIds: [...selectedIds],
          youtubeLink: youtubeLink.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSelectedIds(new Set());
      setYoutubeLink('');
      const refreshed = await fetch('/api/stories').then((r) => r.json());
      setStories(refreshed?.stories || []);
    } catch (err) {
      alert(err.message || 'Something went wrong');
    } finally {
      setLinking(false);
    }
  };

  const rejectedStories = bySearch(byCategory(stories.filter((s) => s.status === 'rejected')));
  const filteredStories =
    activeFilter === 'pending'
      ? newStories
      : activeFilter === 'approved'
      ? shortlisted
      : activeFilter === 'rejected'
      ? rejectedStories
      : activeFilter === 'featured'
      ? featured
      : bySearch(byCategory(stories));

  const canSelect = ['pending', 'approved', 'all'].includes(activeFilter);

  const handleReject = async () => {
    if (!rejectingId) return;
    try {
      const res = await fetch('/api/admin/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId: rejectingId, reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setRejectingId(null);
      setRejectReason('');
      const refreshed = await fetch('/api/stories').then((r) => r.json());
      setStories(refreshed?.stories || []);
    } catch (err) {
      alert(err.message || 'Something went wrong');
    }
  };

  return (
    <>
      <Head>
        <title>Story Inbox – Leyu & Mahi</title>
      </Head>
      <div className="admin-dashboard">
        {sidebarOpen && (
          <div
            className="admin-sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setSidebarOpen(false)}
          />
        )}
        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <h2 className="admin-logo">Story Inbox</h2>
          <nav className="admin-nav">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                className={`admin-nav-item ${activeFilter === item.id ? 'active' : ''}`}
                onClick={() => selectFilter(item.id)}
              >
                <span>{item.label}</span>
                <span className="admin-count">({item.count})</span>
              </button>
            ))}
          </nav>
          <a href="/" className="admin-back">
            ← Back to Mini App
          </a>
        </aside>

        <main className="admin-main">
          <button
            type="button"
            className="admin-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Menu"
          >
            ☰
          </button>
          <header className="admin-header">
            <h1>Manage Stories</h1>
            <p className="admin-hint">
              Stories are ordered by submission (#1 first). Select stories and add a video link to feature them.
            </p>
          </header>

          <div className="admin-filters">
            <input
              type="text"
              placeholder="Search stories..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="admin-search"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="admin-select"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {rejectingId && (
            <div className="admin-reject-modal">
              <div className="admin-reject-box">
                <h4>Reject story</h4>
                <input
                  type="text"
                  placeholder="Reason (optional)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="admin-search"
                />
                <div className="admin-reject-actions">
                  <button onClick={handleReject} className="admin-reject-btn">
                    Reject & notify
                  </button>
                  <button onClick={() => { setRejectingId(null); setRejectReason(''); }} className="admin-clear-btn">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedIds.size > 0 && canSelect && (
            <div className="admin-video-bar">
              <span>
                {selectedIds.size} selected
              </span>
              <input
                type="url"
                placeholder="YouTube link..."
                value={youtubeLink}
                onChange={(e) => setYoutubeLink(e.target.value)}
                className="admin-video-input"
              />
              <button onClick={handleFeatureVideo} disabled={linking || !youtubeLink.trim()} className="admin-video-btn">
                {linking ? 'Linking...' : 'Add video link to selected'}
              </button>
              <button onClick={() => setSelectedIds(new Set())} className="admin-clear-btn">
                Clear
              </button>
            </div>
          )}

          {loading ? (
            <div className="admin-loading">Loading…</div>
          ) : activeFilter === 'all' ? (
            <div className="admin-kanban">
              <div className="admin-column">
                <h3>New</h3>
                {newStories.map((s) => (
                  <StoryCard
                    key={s.id}
                    story={s}
                    selectable={canSelect}
                    selected={selectedIds.has(s.id)}
                    onToggle={() => toggleSelect(s.id)}
                    onReject={() => setRejectingId(s.id)}
                    showReject
                  />
                ))}
                {newStories.length === 0 && <div className="admin-empty">No new stories</div>}
              </div>
              <div className="admin-column">
                <h3>Shortlisted</h3>
                {shortlisted.map((s) => (
                  <StoryCard
                    key={s.id}
                    story={s}
                    selectable={canSelect}
                    selected={selectedIds.has(s.id)}
                    onToggle={() => toggleSelect(s.id)}
                    showReject={false}
                  />
                ))}
                {shortlisted.length === 0 && <div className="admin-empty">None yet</div>}
              </div>
              <div className="admin-column">
                <h3>Featured (in video)</h3>
                {featured.map((s) => (
                  <StoryCard key={s.id} story={s} showReject={false} />
                ))}
                {featured.length === 0 && <div className="admin-empty">None yet</div>}
              </div>
            </div>
          ) : (
            <div className="admin-list">
              {filteredStories.map((s) => (
                <StoryCard
                    key={s.id}
                    story={s}
                    selectable={canSelect}
                    selected={selectedIds.has(s.id)}
                    onToggle={() => toggleSelect(s.id)}
                    onReject={s.status === 'pending' ? () => setRejectingId(s.id) : null}
                    showReject={s.status === 'pending'}
                />
              ))}
              {filteredStories.length === 0 && <div className="admin-empty">No stories</div>}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

function StoryCard({ story, selectable, selected, onToggle, onReject, showReject }) {
  const num = story.story_number != null ? story.story_number : null;
  return (
    <div className={`story-card-admin ${selected ? 'selected' : ''}`}>
      {selectable && (
        <label className="story-check">
          <input type="checkbox" checked={selected} onChange={onToggle} />
        </label>
      )}
      <div className="story-card-bg" />
      <div className="story-card-content">
        <p className="story-text">
          {story.content.length > 150 ? story.content.slice(0, 150) + '…' : story.content}
        </p>
        <div className="story-meta">
          <span className="story-num">#{num != null ? num : story.id.slice(0, 8)}</span>
          <span>@{story.telegram_username || story.telegram_user_id}</span>
        </div>
        <div className="story-card-actions">
          {story.youtube_link && (
            <a href={story.youtube_link} target="_blank" rel="noopener noreferrer" className="story-link">
              📺 Watch video
            </a>
          )}
          {showReject && onReject && (
            <button type="button" onClick={onReject} className="story-reject-btn">
              Reject
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
