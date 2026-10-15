import { CloudOff, Loader2, RefreshCw } from 'lucide-react';
import { useSyncStatus } from '../../hooks/useSyncStatus';
import { syncPendingChanges } from '../../utils/storage';
import { cn } from '@/lib/utils';

// Shows whether a game's latest scores have reached the server. Renders
// nothing when everything is synced and the device is online.
export const SyncStatusBadge = ({ gameId, className }: { gameId: string; className?: string }) => {
  const { isOnline, isSyncing, hasPendingChanges } = useSyncStatus(gameId);

  if (!hasPendingChanges && isOnline) return null;

  const base = 'inline-flex items-center gap-1 px-1 py-0.5 rounded-sm text-xs border bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30';

  if (hasPendingChanges && isSyncing) {
    return (
      <span className={cn(base, className)}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Uploading scores…
      </span>
    );
  }

  if (hasPendingChanges && isOnline) {
    return (
      <button
        type="button"
        onClick={() => syncPendingChanges()}
        className={cn(base, 'hover:bg-amber-500/20 transition-colors', className)}
        title="Some scores are only saved on this device. Tap to try uploading again."
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Not uploaded · Retry
      </button>
    );
  }

  return (
    <span
      className={cn(base, className)}
      title="Scores are being saved on this device and will upload automatically when you're back online. Keep this device handy until they do."
    >
      <CloudOff className="w-3.5 h-3.5" />
      {hasPendingChanges ? 'Offline · Saved on this device' : 'Offline'}
    </span>
  );
};
