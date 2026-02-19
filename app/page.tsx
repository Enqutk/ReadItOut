'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconInstagram, IconTikTok, IconYouTube } from './components/SocialIcons';

export default function Home() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState<{
    photoLeyu?: string;
    photoMahi?: string;
    photoTogether?: string;
    tagline?: string;
  }>({});

  useEffect(() => {
    const tg = (typeof window !== 'undefined' && window.Telegram?.WebApp) || null;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.MainButton?.hide();
    }
    const initData = tg?.initData || '';
    Promise.all([
      fetch(`/api/me?initData=${encodeURIComponent(initData)}`).then((r) => r.json()),
      fetch('/api/app-config').then((r) => r.json()),
    ])
      .then(([me, config]) => {
        setIsAdmin(me?.isAdmin === true);
        setSocialLinks(config?.socialLinks || {});
        setProfile(config?.profile || {});
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const leyLinks = (['instagram_leyu', 'tiktok_leyu'] as const).filter((k) => socialLinks[k]).map((k) => [k, socialLinks[k]] as const);
  const mahLinks = (['instagram_mahi', 'tiktok_mahi'] as const).filter((k) => socialLinks[k]).map((k) => [k, socialLinks[k]] as const);
  const sharedLinks = (['youtube', 'instagram_both'] as const).filter((k) => socialLinks[k]).map((k) => [k, socialLinks[k]] as const);

  const hasPhotos = !!(profile?.photoLeyu || profile?.photoMahi || profile?.photoTogether);
  const tagline = profile?.tagline || 'Two voices. One vibe. Your stories.';

  return (
    <main className="home">
      <div className="home-hero-card">
        <div className="home-avatars">
          {profile?.photoTogether ? (
            <img src={profile.photoTogether} alt="Leyu & Mahi" className="home-avatar home-avatar-together" />
          ) : hasPhotos ? (
            <>
              {profile?.photoLeyu && <img src={profile.photoLeyu} alt="Leyu" className="home-avatar" />}
              {profile?.photoMahi && <img src={profile.photoMahi} alt="Mahi" className="home-avatar" />}
            </>
          ) : (
            <div className="home-icon">✨</div>
          )}
        </div>
        <h1 className="home-title">Leyu & Mahi</h1>
        <p className="home-tagline">{tagline}</p>
        <p className="home-desc">Share your story. We read the best ones in our videos.</p>

        <div className="home-person-tags">
          <div className="home-person-tag">
            <div className="home-person-avatar-wrap">
              {profile?.photoLeyu ? (
                <img src={profile.photoLeyu} alt="Leyu" className="home-person-avatar" />
              ) : (
                <span className="home-person-avatar-placeholder">L</span>
              )}
            </div>
            <span className="home-person-name">Leyu</span>
            {(leyLinks.length > 0) && (
              <div className="home-person-links">
                {leyLinks.map(([key, url]) => (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="home-person-link" aria-label={key}>
                    {key.startsWith('instagram') ? <IconInstagram size={16} className="home-person-icon" /> : <IconTikTok size={16} className="home-person-icon" />}
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="home-person-tag">
            <div className="home-person-avatar-wrap">
              {profile?.photoMahi ? (
                <img src={profile.photoMahi} alt="Mahi" className="home-person-avatar" />
              ) : (
                <span className="home-person-avatar-placeholder">M</span>
              )}
            </div>
            <span className="home-person-name">Mahi</span>
            {(mahLinks.length > 0) && (
              <div className="home-person-links">
                {mahLinks.map(([key, url]) => (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="home-person-link" aria-label={key}>
                    {key.startsWith('instagram') ? <IconInstagram size={16} className="home-person-icon" /> : <IconTikTok size={16} className="home-person-icon" />}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="home-actions home-actions-stable">
        {!ready ? (
          <>
            <div className="home-skeleton-btn" />
            <div className="home-skeleton-btn" />
            <div className="home-skeleton-btn" />
          </>
        ) : (
          <>
            {!isAdmin && (
              <>
                <Link href="/submit" className="btn-primary">
                  <span>✏️</span> Submit Story
                </Link>
                <Link href="/stories" className="btn-secondary">
                  <span>📄</span> My Submissions
                </Link>
              </>
            )}
            <Link href="/about" className="btn-secondary">
              <span>💜</span> About Leyu & Mahi
            </Link>
            {isAdmin && (
              <Link href="/dashboard" className="btn-admin">
                <span>⚙️</span> Admin Dashboard
              </Link>
            )}
          </>
        )}
      </div>

      {(!ready || sharedLinks.length > 0) && (
        <div className="home-social home-social-stable">
          <p className="home-social-label">Leyu & Mahi</p>
          <div className="home-social-links">
            {!ready ? (
              <>
                <div className="home-skeleton-icon" />
                <div className="home-skeleton-icon" />
                <div className="home-skeleton-icon" />
              </>
            ) : (
              sharedLinks.map(([key, url]) => (
                <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="home-social-link" aria-label={key}>
                  {key === 'youtube' ? <IconYouTube size={22} className="home-social-icon" /> : key.startsWith('instagram') ? <IconInstagram size={22} className="home-social-icon" /> : <IconTikTok size={22} className="home-social-icon" />}
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </main>
  );
}
