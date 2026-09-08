'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { BoardViewMode } from '@/features/projects/view-toggle';

const STORAGE_KEY = 'costops:board-view';

export function useBoardViewMode() {
  const mode = useSyncExternalStore<BoardViewMode>(subscribe, readStoredMode, () => 'cards');

  const updateMode = useCallback((next: BoardViewMode) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(STORAGE_KEY));
  }, []);

  return [mode, updateMode] as const;
}

function subscribe(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      onStoreChange();
    }
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(STORAGE_KEY, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(STORAGE_KEY, onStoreChange);
  };
}

function readStoredMode(): BoardViewMode {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'list' ? 'list' : 'cards';
}
