'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { SOCIAL_LINK_KEYS, IconInstagram, IconTikTok, IconYouTube, SOCIAL_LINK_SHORT_LABELS } from '../components/SocialIcons';

const DEFAULT_ABOUT = `Leyu and Mahi — friends who turned late-night conversations into something bigger.

They laugh together, create together, and now they want to hear from you. Share your story and become part of what they're building.

We'll notify you when your story is featured. Thanks for being part of our community! ✨`;

export default function AboutPage() {
  const [ready, setReady] = useState(false);
  const [config, setConfig] = useState<{
    socialLinks: Record<string, string>;
    profile?: { photoLeyu?: string; photoMahi?: string; photoTogether?: string; aboutBlurb?: string };
  }>({ socialLinks: {} });

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.MainButton?.hide();
    }
    fetch('/api/app-config')
      .then((r) => r.json())
      .then((data) => setConfig({
        socialLinks: data.socialLinks || {},
        profile: data.profile || {},
      }))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const links = Object.entries(config.socialLinks);
  const profile = config.profile || {};
  const hasPhotos = !!(profile.photoLeyu || profile.photoMahi || profile.photoTogether);
  const aboutText = (profile.aboutBlurb || DEFAULT_ABOUT).trim();

  return (
    <main className="page">
      <Link href="/" className="link-back">← Back</Link>
      <h1 className="page-title">About Leyu & Mahi</h1>

      {hasPhotos && (
        <div className="about-avatars">
          {profile.photoTogether ? (
            <img src={profile.photoTogether} alt="Leyu & Mahi" className="about-avatar about-avatar-together" />
          ) : (
            <>
              {profile.photoLeyu && <img src={profile.photoLeyu} alt="Leyu" className="about-avatar" />}
              {profile.photoMahi && <img src={profile.photoMahi} alt="Mahi" className="about-avatar" />}
            </>
          )}
        </div>
      )}

      <div className="card about-card">
        <p className="about-text">{aboutText}</p>
      </div>

      <div className="card social-links-card social-links-card-stable" style={{ marginTop: 24 }}>
        <h3 className="social-links-title">Follow Leyu & Mahi</h3>
        <div className="social-links">
          {!ready ? (
            <>
              <div className="social-skeleton" />
              <div className="social-skeleton" />
              <div className="social-skeleton" />
            </>
          ) : links.length > 0 ? (
            links.map(([key, url]) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                <span className="social-icon">
                  {key === 'youtube' ? <IconYouTube size={20} /> : key.startsWith('instagram') ? <IconInstagram size={20} /> : <IconTikTok size={20} />}
                </span>
                <span className="social-label">{SOCIAL_LINK_SHORT_LABELS[key] || key}</span>
              </a>
            ))
          ) : (
            <p className="social-links-empty">No links yet</p>
          )}
        </div>
      </div>
    </main>
  );
}
