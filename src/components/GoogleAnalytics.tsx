'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initGA, trackPageView } from '@/lib/analytics';
import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-ZT9ZYCJF1Z';

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize GA4
    initGA();
  }, []);

  useEffect(() => {
    // Track page views on route changes
    if (pathname && typeof window !== 'undefined') {
      const url = `${window.location.origin}${pathname}${searchParams ? `?${searchParams.toString()}` : ''}`;
      const title = document.title;
      
      // Add a small delay to ensure the page is fully loaded
      const timeoutId = setTimeout(() => {
        trackPageView(url, title);
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [pathname, searchParams]);

  return (
    <>
      {/* Google Analytics Script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Google Analytics script loaded');
        }}
        onError={(e) => {
          console.error('Failed to load Google Analytics script:', e);
        }}
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_title: document.title,
            page_location: window.location.href,
            send_page_view: false
          });
        `}
      </Script>
    </>
  );
}