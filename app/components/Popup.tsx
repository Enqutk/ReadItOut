'use client';

import React, { useEffect, useState } from 'react';

const STORAGE_PREFIX = 'leyu_mahi_popup_';

export default function Popup() {
  const [popup, setPopup] = useState<{
    id: string;
    title: string;
    message: string;
    link?: string;
    linkLabel?: string;
  } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch('/api/app-config')
      .then((r) => r.json())
      .then((data) => {
        const p = data?.popup;
        if (!p || !p.title) return;
        const key = `${STORAGE_PREFIX}${p.id}`;
        try {
          if (typeof window !== 'undefined' && !sessionStorage.getItem(key)) {
            setPopup(p);
            setVisible(true);
          }
        } catch (_) {}
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    if (popup) {
      try {
        sessionStorage.setItem(`${STORAGE_PREFIX}${popup.id}`, '1');
      } catch (_) {}
    }
    setVisible(false);
  };

  if (!visible || !popup) return null;

  return (
    <div className="popup-overlay" role="dialog" aria-modal="true" aria-labelledby="popup-title">
      <div className="popup-box">
        <button
          type="button"
          className="popup-close"
          onClick={dismiss}
          aria-label="Close"
        >
          ×
        </button>
        <h2 id="popup-title" className="popup-title">{popup.title}</h2>
        {popup.message && <p className="popup-message">{popup.message}</p>}
        {popup.link && (
          <a
            href={popup.link}
            target="_blank"
            rel="noopener noreferrer"
            className="popup-link"
          >
            {popup.linkLabel || 'Learn more'}
          </a>
        )}
        <button type="button" onClick={dismiss} className="popup-dismiss">
          Got it
        </button>
      </div>
    </div>
  );
}
