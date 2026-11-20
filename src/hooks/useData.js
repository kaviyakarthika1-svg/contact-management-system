import { useSyncExternalStore, useEffect, useState } from 'react';
import { contactService, recentlyViewedEnrichedStore } from '../services/contactService';
import { groupService } from '../services/groupService';
import { reminderService } from '../services/reminderService';
import { activityService } from '../services/activityService';
import { settingsService } from '../services/settingsService';
import { interactionService } from '../services/interactionService';
import { eventService } from '../services/eventService';

/** Subscribe any component to a service store (React 18+ external stores). */
export function useServiceData(service) {
  return useSyncExternalStore(service.subscribe, service.getSnapshot, service.getSnapshot);
}

export const useContacts = () => useServiceData(contactService.store);
export const useGroups = () => useServiceData(groupService.store);
export const useReminders = () => useServiceData(reminderService.store);
export const useActivities = () => useServiceData(activityService.store);
export const useRecentlyViewed = () => useServiceData(recentlyViewedEnrichedStore);
export const useSettings = () => useServiceData(settingsService.store);
export const useInteractions = () => useServiceData(interactionService.store);
export const useEvents = () => useServiceData(eventService.store);

/** Applies the persisted theme to <html data-theme> and returns a setter. */
export function useTheme() {
  const settingsData = useSettings();
  const theme = settingsData.theme || 'light';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return [theme, (next) => settingsService.setTheme(next)];
}


/** Sets the browser tab title for the current page. */
export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ConnectSphere` : 'ConnectSphere';
    return () => { document.title = 'ConnectSphere'; };
  }, [title]);
}

/** Debounce fast-changing values (search inputs). */
export function useDebounce(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * Brief skeleton state so loading patterns are visible in the demo.
 * Only shows once per browser session to avoid artificial lag afterwards.
 */
export function useSkeleton(duration = 350) {
  const [loading, setLoading] = useState(() => {
    try {
      return sessionStorage.getItem('cms:skeletonShown') !== 'yes';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!loading) return undefined;
    const timer = setTimeout(() => {
      setLoading(false);
      try {
        sessionStorage.setItem('cms:skeletonShown', 'yes');
      } catch {
        /* ignore */
      }
    }, duration);
    return () => clearTimeout(timer);
  }, [loading, duration]);

  return loading;
}
