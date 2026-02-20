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
  const [readingStory, setReadingStory] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [initData, setInitData] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [config, setConfig] = useState({ socialLinks: {}, popup: null, profile: {} });
  const [configSaving, setConfigSaving] = useState(false);

  const selectFilter = (id) => {
    setActiveFilter(id);
    setSidebarOpen(false);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initData) {
      setInitData(window.Telegram.WebApp.initData);
    }
  }, []);

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

  useEffect(() => {
    if (activeFilter === 'settings') {
      fetch('/api/app-config')
        .then((r) => r.json())
        .then((data) => {
          const p = data.popup;
          const prof = data.profile || {};
          setConfig({
            socialLinks: data.socialLinks || {},
            popup: p
              ? { ...p, enabled: !!p.enabled }
              : { id: '1', title: '', message: '', link: '', linkLabel: 'Learn more', enabled: false },
            profile: {
              photoLeyu: prof.photoLeyu || '',
              photoMahi: prof.photoMahi || '',
              photoTogether: prof.photoTogether || '',
              tagline: prof.tagline || 'Two voices. One vibe. Your stories.',
              aboutBlurb: prof.aboutBlurb || '',
            },
          });
        })
        .catch(() => {});
    }
  }, [activeFilter]);

  const counts = { pending: 0, rejected: 0 };
  stories.forEach((s) => {
    if (counts[s.status] !== undefined) counts[s.status]++;
  });
  const featuredCount = stories.filter((s) => s.youtube_link).length;
  const newCount = stories.filter((s) => s.status === 'pending' && !s.read_at).length;
  const categories = [...new Set(stories.map((s) => s.category).filter(Boolean))];

  const sidebarItems = [
    { id: 'all', label: 'All Stories', count: stories.length },
    { id: 'pending', label: 'New', count: newCount },
    { id: 'rejected', label: 'Rejected', count: counts.rejected },
    { id: 'featured', label: 'Already read (contact)', count: featuredCount },
    { id: 'settings', label: 'Settings', count: '' },
  ];

  const byCategory = (list) =>
    !categoryFilter ? list : list.filter((s) => s.category === categoryFilter);
  const bySearch = (list) => {
    if (!searchFilter.trim()) return list;
    const raw = searchFilter.trim();
    const q = raw.toLowerCase().replace(/^#/, '');
    const numSearch = q !== '' && /^\d+$/.test(q) ? parseInt(q, 10) : null;
    return list.filter((s) => {
      if (s.content && s.content.toLowerCase().includes(q)) return true;
      if (s.telegram_username && s.telegram_username.toLowerCase().includes(q)) return true;
      if (numSearch != null && s.submission_number != null && s.submission_number === numSearch) return true;
      if (numSearch != null && s.submission_number != null && String(s.submission_number).includes(q)) return true;
      if (s.id && s.id.toLowerCase().includes(q)) return true;
      return false;
    });
  };

  const newStories = bySearch(byCategory(stories.filter((s) => s.status === 'pending' && !s.read_at)));
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
      : activeFilter === 'rejected'
      ? rejectedStories
      : activeFilter === 'featured'
      ? featured
      : bySearch(byCategory(stories));

  const canSelect = ['pending', 'all'].includes(activeFilter);

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

  const handlePhotoUpload = (name, file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please choose an image (JPEG, PNG, WebP, or GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB.');
      return;
    }
    setUploadingPhoto(name);
    const reader = new FileReader();
    reader.onload = () => {
      const headers = { 'Content-Type': 'application/json' };
      if (initData) headers['X-Telegram-Init-Data'] = initData;
      if (adminSecret.trim()) headers['X-Admin-Secret'] = adminSecret.trim();
      const body = { image: reader.result, name };
      if (initData) body.initData = initData;
      if (adminSecret.trim()) body.adminSecret = adminSecret.trim();
      fetch('/api/admin/upload-photo', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.url) {
            const profileKey = name === 'together' ? 'photoTogether' : name === 'leyu' ? 'photoLeyu' : 'photoMahi';
            setConfig((c) => ({
              ...c,
              profile: { ...(c.profile || {}), [profileKey]: data.url },
            }));
          } else {
            alert(data.error || 'Upload failed');
          }
        })
        .catch(() => alert('Upload failed'))
        .finally(() => setUploadingPhoto(null));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveConfig = async () => {
    if (!initData && !adminSecret.trim()) {
      alert('Open from Telegram app, or enter Admin Secret below.');
      return;
    }
    setConfigSaving(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (initData) headers['X-Telegram-Init-Data'] = initData;
      if (adminSecret.trim()) headers['X-Admin-Secret'] = adminSecret.trim();
      const body = {
        socialLinks: config.socialLinks,
        popup: config.popup
          ? {
              enabled: !!config.popup.enabled,
              id: config.popup.id || '1',
              title: config.popup.title || '',
              message: config.popup.message || '',
              link: config.popup.link || '',
              linkLabel: config.popup.linkLabel || 'Learn more',
            }
          : { enabled: false, id: '1', title: '', message: '', link: '', linkLabel: 'Learn more' },
        profile: {
          photoLeyu: config.profile?.photoLeyu || '',
          photoMahi: config.profile?.photoMahi || '',
          photoTogether: config.profile?.photoTogether || '',
          tagline: config.profile?.tagline || 'Two voices. One vibe. Your stories.',
          aboutBlurb: config.profile?.aboutBlurb || '',
        },
      };
      if (initData) body.initData = initData;
      if (adminSecret.trim()) body.adminSecret = adminSecret.trim();
      const res = await fetch('/api/admin/app-config', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      alert('Settings saved.');
    } catch (err) {
      alert(err.message || 'Could not save.');
    } finally {
      setConfigSaving(false);
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
                {item.count !== '' && <span className="admin-count">({item.count})</span>}
              </button>
            ))}
          </nav>
          <a href="/" className="admin-back">
            ← Back to Mini App
          </a>
        </aside>

        <main className="admin-main">
          <header className="admin-header">
            <div className="admin-header-content">
            <h1>Manage Stories</h1>
            <p className="admin-hint">
              Stories are ordered by submission (#1 first). Select stories and add a video link to feature them.
            </p>
            </div>
            <button
              type="button"
              className="admin-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>
          </header>

          {activeFilter !== 'settings' && (
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
          )}

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

          {readingStory && (
            <div className="admin-reject-modal" onClick={() => setReadingStory(null)}>
              <div className="admin-read-story-box" onClick={(e) => e.stopPropagation()}>
                <div className="admin-read-story-header">
                  <h4>Story #{readingStory.submission_number != null ? readingStory.submission_number : readingStory.id?.slice(0, 8)}</h4>
                  <button type="button" className="admin-read-story-close" onClick={() => setReadingStory(null)} aria-label="Close">
                    ×
                  </button>
                </div>
                <div className="admin-read-story-meta">
                  <span>@{readingStory.telegram_username || readingStory.telegram_user_id || '—'}</span>
                  {readingStory.category && <span className="admin-read-story-category">{readingStory.category}</span>}
                  {readingStory.created_at && (
                    <span className="admin-read-story-date">
                      {new Date(readingStory.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </span>
                  )}
                </div>
                <div className="admin-read-story-body">{readingStory.content}</div>
                <div className="admin-read-story-actions">
                  {readingStory.youtube_link && (
                    <a href={readingStory.youtube_link} target="_blank" rel="noopener noreferrer" className="story-link">
                      📺 Watch video
                    </a>
                  )}
                  {(readingStory.telegram_username || readingStory.telegram_user_id) && (
                    <a
                      href={readingStory.telegram_username ? `https://t.me/${readingStory.telegram_username.replace(/^@/, '')}` : `tg://user?id=${readingStory.telegram_user_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="story-link story-contact-link"
                    >
                      ✉️ Contact
                    </a>
                  )}
                  {readingStory.status === 'pending' && (
                    <button type="button" className="story-reject-btn" onClick={() => { setReadingStory(null); setRejectingId(readingStory.id); }}>
                      Reject
                    </button>
                  )}
                  <button type="button" className="admin-clear-btn" onClick={() => setReadingStory(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeFilter === 'settings' && (
            <div className="admin-settings">
              <section className="admin-settings-section">
                <h3 className="admin-settings-title">Profile photos</h3>
                <p className="admin-hint">Paste URLs or upload. &quot;Together&quot; = main hero. Leyu/Mahi = small tags on home.</p>
                <div className="admin-settings-field">
                  <label className="admin-settings-label">Photo together (main)</label>
                  <input
                    type="url"
                    placeholder="https://... or upload below"
                    value={config.profile?.photoTogether || ''}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        profile: { ...(c.profile || {}), photoTogether: e.target.value },
                      }))
                    }
                    className="admin-search"
                  />
                  <div className="admin-upload-row">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="admin-file-input"
                      id="upload-together"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handlePhotoUpload('together', f);
                        e.target.value = '';
                      }}
                      disabled={!!uploadingPhoto}
                    />
                    <label
                      htmlFor="upload-together"
                      className={`admin-upload-btn ${uploadingPhoto === 'together' ? 'uploading' : ''}`}
                    >
                      {uploadingPhoto === 'together' ? 'Uploading…' : '📷 Upload from gallery'}
                    </label>
                  </div>
                </div>
                <div className="admin-settings-field">
                  <label className="admin-settings-label">Photo Leyu (small tag)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={config.profile?.photoLeyu || ''}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        profile: { ...(c.profile || {}), photoLeyu: e.target.value },
                      }))
                    }
                    className="admin-search"
                  />
                  <div className="admin-upload-row">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="admin-file-input"
                      id="upload-leyu"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handlePhotoUpload('leyu', f);
                        e.target.value = '';
                      }}
                      disabled={!!uploadingPhoto}
                    />
                    <label
                      htmlFor="upload-leyu"
                      className={`admin-upload-btn ${uploadingPhoto === 'leyu' ? 'uploading' : ''}`}
                    >
                      {uploadingPhoto === 'leyu' ? 'Uploading…' : '📷 Upload'}
                    </label>
                  </div>
                </div>
                <div className="admin-settings-field">
                  <label className="admin-settings-label">Photo Mahi (small tag)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={config.profile?.photoMahi || ''}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        profile: { ...(c.profile || {}), photoMahi: e.target.value },
                      }))
                    }
                    className="admin-search"
                  />
                  <div className="admin-upload-row">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="admin-file-input"
                      id="upload-mahi"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handlePhotoUpload('mahi', f);
                        e.target.value = '';
                      }}
                      disabled={!!uploadingPhoto}
                    />
                    <label
                      htmlFor="upload-mahi"
                      className={`admin-upload-btn ${uploadingPhoto === 'mahi' ? 'uploading' : ''}`}
                    >
                      {uploadingPhoto === 'mahi' ? 'Uploading…' : '📷 Upload'}
                    </label>
                  </div>
                </div>
                <div className="admin-settings-field">
                  <label className="admin-settings-label">Tagline (home page)</label>
                  <input
                    type="text"
                    placeholder="Two voices. One vibe. Your stories."
                    value={config.profile?.tagline || ''}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        profile: { ...(c.profile || {}), tagline: e.target.value },
                      }))
                    }
                    className="admin-search"
                  />
                </div>
                <div className="admin-settings-field">
                  <label className="admin-settings-label">About blurb (About page)</label>
                  <textarea
                    placeholder="Leyu and Mahi — friends who turned late-night conversations into something bigger..."
                    value={config.profile?.aboutBlurb || ''}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        profile: { ...(c.profile || {}), aboutBlurb: e.target.value },
                      }))
                    }
                    className="admin-search"
                    rows={4}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </section>
              <section className="admin-settings-section">
                <h3 className="admin-settings-title">Social links</h3>
                <p className="admin-hint">Shown on home and About. Leave blank to hide.</p>
                <div className="admin-social-group">
                  <h4 className="admin-social-group-title">Leyu&apos;s</h4>
                  {[
                    { key: 'instagram_leyu', label: 'Instagram', placeholder: 'https://instagram.com/...' },
                    { key: 'tiktok_leyu', label: 'TikTok', placeholder: 'https://tiktok.com/@...' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key} className="admin-settings-field">
                      <label className="admin-settings-label">{label}</label>
                      <input
                        type="url"
                        placeholder={placeholder}
                        value={config.socialLinks[key] || ''}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            socialLinks: { ...c.socialLinks, [key]: e.target.value },
                          }))
                        }
                        className="admin-search"
                      />
                    </div>
                  ))}
                </div>
                <div className="admin-social-group">
                  <h4 className="admin-social-group-title">Mahi&apos;s</h4>
                  {[
                    { key: 'instagram_mahi', label: 'Instagram', placeholder: 'https://instagram.com/...' },
                    { key: 'tiktok_mahi', label: 'TikTok', placeholder: 'https://tiktok.com/@...' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key} className="admin-settings-field">
                      <label className="admin-settings-label">{label}</label>
                      <input
                        type="url"
                        placeholder={placeholder}
                        value={config.socialLinks[key] || ''}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            socialLinks: { ...c.socialLinks, [key]: e.target.value },
                          }))
                        }
                        className="admin-search"
                      />
                    </div>
                  ))}
                </div>
                <div className="admin-social-group">
                  <h4 className="admin-social-group-title">Leyu & Mahi&apos;s</h4>
                  {[
                    { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@...' },
                    { key: 'instagram_both', label: 'Instagram', placeholder: 'https://instagram.com/...' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key} className="admin-settings-field">
                      <label className="admin-settings-label">{label}</label>
                      <input
                        type="url"
                        placeholder={placeholder}
                        value={config.socialLinks[key] || ''}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            socialLinks: { ...c.socialLinks, [key]: e.target.value },
                          }))
                        }
                        className="admin-search"
                      />
                    </div>
                  ))}
                </div>
              </section>
              <section className="admin-settings-section">
                <h3 className="admin-settings-title">Popup (ad / event)</h3>
                <p className="admin-hint">Shown once per session when users open the mini app.</p>
                <div className="admin-settings-field">
                  <label className="admin-settings-check">
                    <input
                      type="checkbox"
                      checked={!!config.popup?.enabled}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          popup: { ...(c.popup || {}), enabled: e.target.checked },
                        }))
                      }
                    />
                    Enable popup
                  </label>
                </div>
                <div className="admin-settings-field">
                  <label className="admin-settings-label">Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Upcoming event"
                    value={config.popup?.title || ''}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        popup: { ...(c.popup || {}), title: e.target.value },
                      }))
                    }
                    className="admin-search"
                  />
                </div>
                <div className="admin-settings-field">
                  <label className="admin-settings-label">Message</label>
                  <input
                    type="text"
                    placeholder="e.g. Join us live this Saturday!"
                    value={config.popup?.message || ''}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        popup: { ...(c.popup || {}), message: e.target.value },
                      }))
                    }
                    className="admin-search"
                  />
                </div>
                <div className="admin-settings-field">
                  <label className="admin-settings-label">Link (optional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={config.popup?.link || ''}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        popup: { ...(c.popup || {}), link: e.target.value },
                      }))
                    }
                    className="admin-search"
                  />
                </div>
                <div className="admin-settings-field">
                  <label className="admin-settings-label">Link button text</label>
                  <input
                    type="text"
                    placeholder="Learn more"
                    value={config.popup?.linkLabel || 'Learn more'}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        popup: { ...(c.popup || {}), linkLabel: e.target.value },
                      }))
                    }
                    className="admin-search"
                  />
                </div>
                <div className="admin-settings-field">
                  <label className="admin-settings-label">Popup version (change to show again to users)</label>
                  <input
                    type="text"
                    placeholder="1"
                    value={config.popup?.id || '1'}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        popup: { ...(c.popup || {}), id: e.target.value || '1' },
                      }))
                    }
                    className="admin-search"
                  />
                </div>
              </section>
              <div className="admin-settings-field" style={{ marginTop: 16 }}>
                <label className="admin-settings-label">Admin secret (if opening in browser)</label>
                <input
                  type="password"
                  placeholder="Set ADMIN_API_SECRET in Vercel env"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  className="admin-search"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={configSaving}
                className="admin-video-btn"
                style={{ marginTop: 12 }}
              >
                {configSaving ? 'Saving…' : 'Save settings'}
              </button>
              {!initData && !adminSecret && (
                <p className="admin-hint" style={{ marginTop: 12 }}>
                  Open from Telegram app, or set ADMIN_API_SECRET in Vercel and enter it above.
                </p>
              )}
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

          {loading && activeFilter !== 'settings' ? (
            <div className="admin-loading">Loading…</div>
          ) : activeFilter === 'settings' ? null : (
            <div className="admin-list">
              {activeFilter === 'all' && (
                <p className="admin-hint admin-hint-inline">
                  All stories by submission order. Use search or category to narrow down.
                </p>
              )}
              {activeFilter === 'featured' && (
                <p className="admin-hint admin-hint-inline">
                  Stories with video links – kept here so you can contact fans if needed.
                </p>
              )}
              {filteredStories.map((s) => (
                <StoryCard
                  key={s.id}
                  story={s}
                  selectable={canSelect}
                  selected={selectedIds.has(s.id)}
                  onToggle={() => toggleSelect(s.id)}
                  onReject={s.status === 'pending' ? () => setRejectingId(s.id) : null}
                  onReadStory={() => setReadingStory(s)}
                  showReject={s.status === 'pending'}
                  showContact={!!s.youtube_link}
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

function StoryCard({ story, selectable, selected, onToggle, onReject, onReadStory, showReject, showContact }) {
  const num = story.submission_number != null ? story.submission_number : null;
  const contactHref = story.telegram_username
    ? `https://t.me/${story.telegram_username.replace(/^@/, '')}`
    : story.telegram_user_id
    ? `tg://user?id=${story.telegram_user_id}`
    : null;
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
          <span className="story-num">#{num != null ? num : (story.id && story.id.slice(0, 8))}</span>
          <span>@{story.telegram_username || story.telegram_user_id}</span>
        </div>
        <div className="story-card-actions">
          {onReadStory && (
            <button type="button" onClick={onReadStory} className="story-read-btn">
              📖 Read story
            </button>
          )}
          {story.youtube_link && (
            <a href={story.youtube_link} target="_blank" rel="noopener noreferrer" className="story-link">
              📺 Watch video
            </a>
          )}
          {showContact && contactHref && (
            <a href={contactHref} target="_blank" rel="noopener noreferrer" className="story-link story-contact-link">
              ✉️ Contact
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
