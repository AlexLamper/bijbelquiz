'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// ---------------------------------------------------------------------------
// Thin typed wrapper around window.gtag so the rest of the app can fire
// events without importing this component.
// ---------------------------------------------------------------------------
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

/** Fire a GA4 custom event from anywhere in the client. */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

// ---------------------------------------------------------------------------
// Inner component - must be wrapped in <Suspense> because it uses
// useSearchParams(), which opts the page into client-side rendering.
// ---------------------------------------------------------------------------
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID || typeof window.gtag !== 'function') return;

    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

    window.gtag('config', GA_ID, {
      page_path: url,
    });
  }, [pathname, searchParams]);

  return null;
}

// ---------------------------------------------------------------------------
// Main component - add once to the root layout.
// ---------------------------------------------------------------------------
export default function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      {/* Load the GA4 library */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />

      {/* Initialise dataLayer and gtag */}
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
            send_page_view: true,
          });
        `}
      </Script>

      {/* Track subsequent client-side navigations */}
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
