# Google Analytics 4 (GA4) Integration

## Overview
This document describes the Google Analytics 4 integration implemented in the AuraZ app. The integration provides comprehensive tracking for page views, user interactions, and custom events.

## Files Added/Modified

### New Files Created:
- `src/lib/analytics.ts` - Core analytics utilities and configuration
- `src/components/GoogleAnalytics.tsx` - Main GA4 component with script loading
- `src/hooks/useAnalytics.ts` - React hook for easy analytics usage
- `src/components/AnalyticsTest.tsx` - Test component for verifying tracking
- `src/app/analytics-test/page.tsx` - Test page for analytics verification

### Modified Files:
- `src/app/layout.tsx` - Added GoogleAnalytics component
- `next.config.ts` - Updated for Vercel compatibility

## Implementation Details

### 1. Core Analytics Setup (`src/lib/analytics.ts`)
- **Measurement ID**: `G-ZT9ZYCJF1Z`
- **TypeScript support**: Proper type definitions for gtag
- **Error handling**: Try-catch blocks for robust error handling
- **Functions provided**:
  - `initGA()` - Initialize Google Analytics
  - `trackPageView()` - Track page views with URL and title
  - `trackEvent()` - Track custom events
  - `trackUserEngagement()` - Track user engagement metrics
  - `trackAppEvent()` - Track app-specific events

### 2. GoogleAnalytics Component (`src/components/GoogleAnalytics.tsx`)
- **Client-side only**: Uses 'use client' directive
- **Route tracking**: Automatically tracks page views on route changes
- **Script loading**: Uses Next.js Script component with 'afterInteractive' strategy
- **Error handling**: Console logging for script load success/failure
- **Performance**: Optimized with proper cleanup and timeouts

### 3. Analytics Hook (`src/hooks/useAnalytics.ts`)
- **Easy integration**: Simple hook for components to use analytics
- **App-specific functions**:
  - `trackJournalEntry()` - Track journal entries
  - `trackBreathworkSession()` - Track breathwork sessions
  - `trackAuraPointsEarned()` - Track aura points
  - `trackChatMessage()` - Track chat interactions
  - `trackFeatureUsage()` - Track feature usage

## Usage Examples

### Basic Event Tracking
```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function MyComponent() {
  const { track } = useAnalytics();
  
  const handleClick = () => {
    track('button_click', { button_name: 'submit' });
  };
}
```

### App-Specific Tracking
```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function JournalComponent() {
  const { trackJournalEntry } = useAnalytics();
  
  const handleJournalSubmit = (type: string, mood: string) => {
    trackJournalEntry(type, mood);
  };
}
```

## Vercel Deployment Compatibility

### Configuration Updates
- **Next.js Script component**: Uses 'afterInteractive' strategy for optimal performance
- **Error handling**: Graceful fallbacks for script loading failures
- **TypeScript support**: Full type safety for analytics functions
- **Build optimization**: No impact on build process or bundle size

### Deployment Considerations
- ✅ Works with Vercel's edge functions
- ✅ Compatible with Next.js App Router
- ✅ No additional environment variables required
- ✅ No server-side dependencies
- ✅ Client-side only implementation

## Testing

### Test Page
Visit `/analytics-test` to test the integration:
- Test basic event tracking
- Test engagement tracking
- Test app-specific events
- Verify page view tracking

### Verification Steps
1. Open Google Analytics dashboard
2. Navigate to Real-Time reports
3. Use the test page to send events
4. Verify events appear in Real-Time
5. Navigate between pages to test page view tracking

### Expected Behavior
- ✅ Page views track automatically on route changes
- ✅ Custom events appear in Real-Time reports
- ✅ No console errors related to Google Analytics
- ✅ Scripts load with proper timing
- ✅ Works in both development and production

## Performance Impact

### Optimizations
- **Lazy loading**: Scripts load after page interaction
- **Error boundaries**: Graceful handling of script failures
- **Minimal bundle impact**: Analytics code is tree-shakeable
- **No blocking**: Scripts don't block page rendering

### Bundle Size
- Analytics utilities: ~2KB gzipped
- No impact on main bundle (loaded separately)
- TypeScript definitions included

## Security & Privacy

### Data Collection
- **Page views**: URL, title, timestamp
- **User interactions**: Button clicks, feature usage
- **App events**: Journal entries, breathwork sessions, chat messages
- **No PII**: No personally identifiable information collected

### Compliance
- **GDPR ready**: Can be easily disabled for EU users
- **Privacy focused**: Only essential analytics data
- **User control**: Analytics can be disabled via user preferences

## Troubleshooting

### Common Issues
1. **Script not loading**: Check network connectivity and ad blockers
2. **Events not appearing**: Verify Measurement ID is correct
3. **Console errors**: Check for JavaScript errors in browser console
4. **Real-Time not showing**: Wait 1-2 minutes for data to appear

### Debug Mode
Enable debug mode by adding `?debug=true` to any URL to see detailed analytics logs in the console.

## Future Enhancements

### Planned Features
- Enhanced e-commerce tracking for premium features
- Custom dimensions for user segments
- Conversion tracking for key app actions
- A/B testing integration
- Enhanced measurement for user engagement

### Monitoring
- Regular verification of tracking accuracy
- Performance monitoring for analytics impact
- User feedback on privacy concerns
- Compliance with evolving privacy regulations

## Support

For issues with the GA4 integration:
1. Check the test page at `/analytics-test`
2. Verify Google Analytics dashboard shows data
3. Check browser console for errors
4. Ensure Measurement ID is correct: `G-ZT9ZYCJF1Z`

The integration is production-ready and fully compatible with Vercel deployment.