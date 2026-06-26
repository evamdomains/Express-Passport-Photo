'use client';

import { useEffect } from 'react';

/**
 * When the upload page is opened with ?autoscroll=1 (e.g. from the homepage
 * "Get My Passport Photo Now" CTA), let the hero show for 1.5 seconds, then
 * smoothly slide down to the "Choose your document type" section (#start).
 * Reads the query string directly (no useSearchParams), so it needs no Suspense
 * boundary. Renders nothing; cancelled if the user scrolls/navigates away.
 */
const DELAY_MS = 1500;

export default function AutoScrollToStart() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('autoscroll') !== '1') return;

    let userInterrupted = false;
    const onUserScroll = () => { userInterrupted = true; };
    // Only treat genuine user input as an interruption (wheel/touch/key).
    window.addEventListener('wheel', onUserScroll, { passive: true });
    window.addEventListener('touchmove', onUserScroll, { passive: true });
    window.addEventListener('keydown', onUserScroll);

    const t = setTimeout(() => {
      if (!userInterrupted) {
        document.getElementById('start')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, DELAY_MS);

    return () => {
      clearTimeout(t);
      window.removeEventListener('wheel', onUserScroll);
      window.removeEventListener('touchmove', onUserScroll);
      window.removeEventListener('keydown', onUserScroll);
    };
  }, []);

  return null;
}
