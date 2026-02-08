import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

// Generate a unique session ID for this browser session
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('activity_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('activity_session_id', sessionId);
  }
  return sessionId;
};

// Get device info
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  let deviceType = 'desktop';
  if (/mobile/i.test(ua)) deviceType = 'mobile';
  else if (/tablet|ipad/i.test(ua)) deviceType = 'tablet';

  let browser = 'unknown';
  if (/chrome/i.test(ua)) browser = 'chrome';
  else if (/firefox/i.test(ua)) browser = 'firefox';
  else if (/safari/i.test(ua)) browser = 'safari';
  else if (/edge/i.test(ua)) browser = 'edge';

  return {
    deviceType,
    browser,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
  };
};

interface TrackEventOptions {
  eventType: 'page_view' | 'feature_use' | 'click' | 'form_submit' | 'error' | 'search';
  eventCategory: string;
  pagePath?: string;
  pageTitle?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
  durationMs?: number;
}

// Debounce function to prevent too many events
const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Queue for batching events
let eventQueue: TrackEventOptions[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

const flushEvents = async (userId: string | null) => {
  if (eventQueue.length === 0 || !userId) return;

  const eventsToSend = [...eventQueue];
  eventQueue = [];

  const deviceInfo = getDeviceInfo();
  const sessionId = getSessionId();

  try {
    const { error } = await supabase.from('user_activity').insert(
      eventsToSend.map((event) => ({
        user_id: userId,
        session_id: sessionId,
        event_type: event.eventType,
        event_category: event.eventCategory,
        page_path: event.pagePath || window.location.pathname,
        page_title: event.pageTitle || document.title,
        component: event.component,
        action: event.action,
        metadata: event.metadata || {},
        device_type: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        screen_size: deviceInfo.screenSize,
        referrer: document.referrer || null,
        duration_ms: event.durationMs,
      }))
    );

    if (error) {
      console.error('Failed to track activity:', error);
    }
  } catch (err) {
    console.error('Error tracking activity:', err);
  }
};

export function useActivityTracker() {
  const location = useLocation();
  const pageStartTime = useRef<number>(Date.now());
  const userIdRef = useRef<string | null>(null);
  const lastPageRef = useRef<string>('');

  // Get user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      userIdRef.current = user?.id || null;
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      userIdRef.current = session?.user?.id || null;
    });

    return () => subscription.unsubscribe();
  }, []);

  // Track page views
  useEffect(() => {
    const currentPath = location.pathname;

    // Don't track if same page or no user
    if (currentPath === lastPageRef.current) return;

    // Calculate duration on previous page
    const duration = Date.now() - pageStartTime.current;

    // Track previous page duration (if there was a previous page)
    if (lastPageRef.current && userIdRef.current && duration > 1000) {
      trackEvent({
        eventType: 'page_view',
        eventCategory: 'navigation',
        pagePath: lastPageRef.current,
        durationMs: duration,
      });
    }

    // Reset for new page
    pageStartTime.current = Date.now();
    lastPageRef.current = currentPath;

    // Track new page view immediately
    if (userIdRef.current) {
      trackEvent({
        eventType: 'page_view',
        eventCategory: 'navigation',
        pagePath: currentPath,
        pageTitle: document.title,
      });
    }
  }, [location.pathname]);

  // Flush events on unmount or page leave
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (userIdRef.current && eventQueue.length > 0) {
        // Use sendBeacon for reliable delivery on page close
        const deviceInfo = getDeviceInfo();
        const sessionId = getSessionId();

        const events = eventQueue.map((event) => ({
          user_id: userIdRef.current,
          session_id: sessionId,
          event_type: event.eventType,
          event_category: event.eventCategory,
          page_path: event.pagePath || window.location.pathname,
          page_title: event.pageTitle || document.title,
          component: event.component,
          action: event.action,
          metadata: event.metadata || {},
          device_type: deviceInfo.deviceType,
          browser: deviceInfo.browser,
          screen_size: deviceInfo.screenSize,
          referrer: document.referrer || null,
          duration_ms: event.durationMs,
        }));

        // Try to send via beacon API
        navigator.sendBeacon?.(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_activity`,
          JSON.stringify(events)
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Track event function
  const trackEvent = useCallback((options: TrackEventOptions) => {
    if (!userIdRef.current) return;

    eventQueue.push(options);

    // Batch events - flush every 5 seconds or when queue hits 10 events
    if (eventQueue.length >= 10) {
      flushEvents(userIdRef.current);
    } else if (!flushTimeout) {
      flushTimeout = setTimeout(() => {
        flushEvents(userIdRef.current);
        flushTimeout = null;
      }, 5000);
    }
  }, []);

  // Track feature usage
  const trackFeature = useCallback((component: string, action: string, metadata?: Record<string, any>) => {
    trackEvent({
      eventType: 'feature_use',
      eventCategory: 'feature',
      component,
      action,
      metadata,
    });
  }, [trackEvent]);

  // Track button clicks
  const trackClick = useCallback((component: string, action: string, metadata?: Record<string, any>) => {
    trackEvent({
      eventType: 'click',
      eventCategory: 'interaction',
      component,
      action,
      metadata,
    });
  }, [trackEvent]);

  // Track form submissions
  const trackFormSubmit = useCallback((formName: string, success: boolean, metadata?: Record<string, any>) => {
    trackEvent({
      eventType: 'form_submit',
      eventCategory: 'form',
      component: formName,
      action: success ? 'success' : 'failure',
      metadata,
    });
  }, [trackEvent]);

  // Track searches
  const trackSearch = useCallback((query: string, resultsCount: number, metadata?: Record<string, any>) => {
    trackEvent({
      eventType: 'search',
      eventCategory: 'search',
      action: query,
      metadata: { ...metadata, results_count: resultsCount },
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackFeature,
    trackClick,
    trackFormSubmit,
    trackSearch,
  };
}

// Standalone function for tracking outside of React components
export const trackActivity = async (
  userId: string,
  options: TrackEventOptions
) => {
  const deviceInfo = getDeviceInfo();
  const sessionId = getSessionId();

  try {
    await supabase.from('user_activity').insert({
      user_id: userId,
      session_id: sessionId,
      event_type: options.eventType,
      event_category: options.eventCategory,
      page_path: options.pagePath || window.location.pathname,
      page_title: options.pageTitle || document.title,
      component: options.component,
      action: options.action,
      metadata: options.metadata || {},
      device_type: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      screen_size: deviceInfo.screenSize,
      referrer: document.referrer || null,
      duration_ms: options.durationMs,
    });
  } catch (err) {
    console.error('Error tracking activity:', err);
  }
};
