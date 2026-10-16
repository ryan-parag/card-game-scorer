import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, Eye, Radio, Share2 } from 'lucide-react';
import { Button } from './ui/button';
import { Modal } from './ui/Modal';
import { useGameViewers, liveGameUrl } from '../hooks/useLiveGame';

// Lets the scorekeeper invite the table to follow along on their own phones.
// Mounting this also announces the scorekeeper on the game's live channel, so
// viewers can tell when their connection drops.
export const LiveShareButton = ({ gameId, isLeagueGame = false }: { gameId: string; isLeagueGame?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const viewerCount = useGameViewers(gameId);
  const url = liveGameUrl(gameId);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy live link:', error);
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: 'Follow the game live', url });
    } catch {
      // Dismissing the share sheet rejects; nothing to do.
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="p-3 bg-card rounded-xl gap-1.5"
        title="Let other players follow the scores on their phones"
      >
        <Radio size={16} />
        <span>Share live</span>
        {viewerCount > 0 && (
          <span className="inline-flex items-center gap-1 ml-1 px-1.5 rounded-full text-xs bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300">
            <Eye className="w-3 h-3" />
            {viewerCount}
          </span>
        )}
      </Button>

      <Modal open={isOpen} onClose={() => setIsOpen(false)} closeOnBackdropClick className="max-w-sm">
        <h2 className="text-lg font-bold mb-1">Follow along live</h2>
        <p className="text-sm text-muted-foreground mb-5">
          {isLeagueGame
            ? "League members can scan this to watch scores and win odds update on their own phone. League games are members-only, so they'll need to sign in."
            : 'Anyone at the table can scan this to watch scores and win odds update on their own phone. No account needed.'}
        </p>
        <div className="flex justify-center mb-5">
          {/* Always dark-on-white so it scans reliably in dark mode. */}
          <div className="p-3 rounded-xl bg-white">
            <QRCodeSVG value={url} size={200} marginSize={0} bgColor="#ffffff" fgColor="#000000" />
          </div>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <input
            readOnly
            value={url}
            onFocus={e => e.currentTarget.select()}
            className="min-w-0 flex-1 h-10 px-3 rounded-md border border-input bg-transparent text-sm text-muted-foreground"
            aria-label="Live game link"
          />
          <Button variant="outline" size="icon" onClick={handleCopy} title="Copy link" className="h-10 w-10 shrink-0">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </Button>
          {canNativeShare && (
            <Button variant="outline" size="icon" onClick={handleNativeShare} title="Share link" className="h-10 w-10 shrink-0">
              <Share2 size={16} />
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Eye className="w-4 h-4" />
            {viewerCount === 0 ? 'No one watching yet' : `${viewerCount} watching`}
          </span>
          <Button onClick={() => setIsOpen(false)}>Done</Button>
        </div>
      </Modal>
    </>
  );
};
