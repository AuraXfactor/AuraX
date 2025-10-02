'use client';

import { useCallback } from 'react';
import { trackEvent, trackUserEngagement, trackAppEvent } from '@/lib/analytics';

export const useAnalytics = () => {
  const track = useCallback((eventName: string, parameters?: Record<string, any>) => {
    trackEvent(eventName, parameters);
  }, []);

  const trackEngagement = useCallback((action: string, category: string, label?: string) => {
    trackUserEngagement(action, category, label);
  }, []);

  const trackApp = useCallback((eventName: string, parameters?: Record<string, any>) => {
    trackAppEvent(eventName, parameters);
  }, []);

  // App-specific tracking functions
  const trackJournalEntry = useCallback((type: string, mood?: string) => {
    trackApp('journal_entry', {
      journal_type: type,
      mood: mood,
    });
  }, []);

  const trackBreathworkSession = useCallback((duration: number, type: string) => {
    trackApp('breathwork_session', {
      duration_seconds: duration,
      breathwork_type: type,
    });
  }, []);

  const trackAuraPointsEarned = useCallback((points: number, source: string) => {
    trackApp('aura_points_earned', {
      points: points,
      source: source,
    });
  }, []);

  const trackChatMessage = useCallback((messageType: 'sent' | 'received', chatType: string) => {
    trackApp('chat_message', {
      message_type: messageType,
      chat_type: chatType,
    });
  }, []);

  const trackFeatureUsage = useCallback((feature: string, action: string) => {
    trackApp('feature_usage', {
      feature: feature,
      action: action,
    });
  }, []);

  return {
    track,
    trackEngagement,
    trackApp,
    trackJournalEntry,
    trackBreathworkSession,
    trackAuraPointsEarned,
    trackChatMessage,
    trackFeatureUsage,
  };
};