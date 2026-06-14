import { useCallback, useEffect, useRef } from 'react';
import { api } from './api';

interface ContentVersions {
  [contentType: string]: string;
}

let cachedVersions: ContentVersions | null = null;

async function fetchVersions(): Promise<ContentVersions | null> {
  try {
    return await api.get<ContentVersions>('/content/versions', { anonymous: true });
  } catch {
    return null;
  }
}

export function useContentPolling(
  contentTypes: string[],
  onChanged: () => void,
  intervalMs = 15_000,
) {
  const onChangedRef = useRef(onChanged);
  onChangedRef.current = onChanged;
  const contentTypesKey = contentTypes.join(',');

  const poll = useCallback(async () => {
    const versions = await fetchVersions();
    if (!versions) return;

    if (!cachedVersions) {
      cachedVersions = versions;
      return;
    }

    for (const ct of contentTypes) {
      if (versions[ct] && cachedVersions[ct] !== versions[ct]) {
        cachedVersions = versions;
        onChangedRef.current();
        return;
      }
    }
  }, [contentTypesKey]);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, intervalMs);
    return () => clearInterval(interval);
  }, [poll, intervalMs]);

  useEffect(() => {
    const onVisibility = () => { if (document.visibilityState === 'visible') poll(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [poll]);
}
