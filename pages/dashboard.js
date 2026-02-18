import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Dashboard() {
  const [stories, setStories] = useState([]);

  useEffect(() => {
    document.body.classList.add('admin-page');
    return () => document.body.classList.remove('admin-page');
  }, []);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('pending');

  useEffect(() => {
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

  const sidebarItems = [
    { id: 'all', label: 'All Stories', count: stories.length },
    { id: 'pending', label: 'New', count: counts.pending },
    { id: 'approved', label: 'Shortlisted', count: counts.approved },
    { id: 'rejected', label: 'Rejected', count: counts.rejected },
    { id: 'featured', label: 'Featured', count: featuredCount },
  ];

  const newStories = stories.filter((s) => s.status === 'pending');
  const shortlisted = stories.filter((s) => s.status === 'approved');
  const featured = stories.filter((s) => s.youtube_link);

  return (
    <>
      <Head>
        <title>Story Inbox – Leyu & Mahi</title>
      </Head>
      <div className="admin-dashboard">
        <aside className="admin-sidebar">
          <h2 className="admin-logo">Story Inbox</h2>
          <nav className="admin-nav">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                className={`admin-nav-item ${activeFilter === item.id ? 'active' : ''}`}
                onClick={() => setActiveFilter(item.id)}
              >
                <span>{item.label}</span>
                <span className="admin-count">({item.count})</span>
              </button>
            ))}
          </nav>
          <a href="/" className="admin-back">← Back to Mini App</a>
        </aside>

        <main className="admin-main">
          <header className="admin-header">
            <h1>Manage Stories</h1>
            <p className="admin-hint">Use Telegram /approve, /reject, /select_for_video for actions</p>
          </header>

          {loading ? (
            <div className="admin-loading">Loading…</div>
          ) : activeFilter === 'all' ? (
            <div className="admin-kanban">
              <div className="admin-column">
                <h3>New Stories</h3>
                {newStories.map((s) => (
                  <StoryCard key={s.id} story={s} />
                ))}
                {newStories.length === 0 && <div className="admin-empty">No new stories</div>}
              </div>
              <div className="admin-column">
                <h3>Shortlisted</h3>
                {shortlisted.map((s) => (
                  <StoryCard key={s.id} story={s} />
                ))}
                {shortlisted.length === 0 && <div className="admin-empty">None yet</div>}
              </div>
              <div className="admin-column">
                <h3>Featured (in video)</h3>
                {featured.map((s) => (
                  <StoryCard key={s.id} story={s} />
                ))}
                {featured.length === 0 && <div className="admin-empty">None yet</div>}
              </div>
            </div>
          ) : (
            <div className="admin-list">
              {(activeFilter === 'pending' ? newStories : activeFilter === 'approved' ? shortlisted : activeFilter === 'rejected' ? stories.filter((s) => s.status === 'rejected') : featured).map((s) => (
                <StoryCard key={s.id} story={s} />
              ))}
              {((activeFilter === 'pending' ? newStories : activeFilter === 'approved' ? shortlisted : activeFilter === 'rejected' ? stories.filter((s) => s.status === 'rejected') : featured).length === 0) && (
                <div className="admin-empty">No stories</div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

function StoryCard({ story }) {
  return (
    <div className="story-card-admin">
      <div className="story-card-bg" />
      <div className="story-card-content">
        <p className="story-text">{story.content.slice(0, 150)}{story.content.length > 150 ? '…' : ''}</p>
        <div className="story-meta">
          <span>#{story.id.slice(0, 8)}</span>
          <span>@{story.telegram_username || story.telegram_user_id}</span>
        </div>
        {story.youtube_link && (
          <a href={story.youtube_link} target="_blank" rel="noopener noreferrer" className="story-link">
            📺 Watch video
          </a>
        )}
      </div>
    </div>
  );
}
