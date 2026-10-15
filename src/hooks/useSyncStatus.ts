import { useEffect, useState } from 'react';
import { hasPendingGame, isSyncInProgress, subscribeToSyncStatus } from '../utils/storage';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  // True when this game has changes saved on this device that haven't
  // reached the server yet.
  hasPendingChanges: boolean;
}

const readStatus = (gameId?: string): SyncStatus => ({
  isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  isSyncing: isSyncInProgress(),
  hasPendingChanges: !!gameId && hasPendingGame(gameId),
});

export const useSyncStatus = (gameId?: string): SyncStatus => {
  const [status, setStatus] = useState<SyncStatus>(() => readStatus(gameId));

  useEffect(() => {
    const update = () => setStatus(readStatus(gameId));
    update();
    const unsubscribe = subscribeToSyncStatus(update);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      unsubscribe();
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, [gameId]);

  return status;
};
