import { useEffect, useState } from 'react';
import { AlertCircle, Check, Loader, Share2 } from 'lucide-react';
import { Button, ButtonProps } from './ui/button';
import { requestShareLink, shareOrCopy, shareRequestKey, ShareCardRequest } from '../utils/shareLinks';
import { cn } from '@/lib/utils';

interface ShareCardButtonProps {
  request: ShareCardRequest;
  // Text for the share sheet; the link preview carries the details.
  title: string;
  label?: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
  icon?: React.ReactNode;
}

// Shares a link whose preview is a card image (see api/og-card.tsx). The link
// is fetched as soon as the button shows, because Safari only opens the share
// sheet when it's called straight from the tap, not after a network request.
export const ShareCardButton = ({
  request,
  title,
  label = 'Share',
  variant = 'outline',
  size = 'sm',
  className,
  icon,
}: ShareCardButtonProps) => {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'working' | 'copied' | 'failed'>('idle');
  const key = shareRequestKey(request);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    setError(null);
    requestShareLink(request)
      .then(link => { if (!cancelled) setUrl(link); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Could not create a share link.'); });
    return () => { cancelled = true; };
    // `key` captures everything in `request`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const handleClick = async () => {
    setStatus('working');
    try {
      const link = url ?? (await requestShareLink(request));
      setUrl(link);
      const result = await shareOrCopy(link, title);
      if (result === 'copied') {
        setStatus('copied');
        setTimeout(() => setStatus('idle'), 2000);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not share.');
      setStatus('failed');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }
    setStatus('idle');
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={status === 'working'}
      title={error ?? undefined}
      className={cn('gap-1.5', className)}
    >
      {status === 'working' ? (
        <Loader className="w-3.5 h-3.5 animate-spin" />
      ) : status === 'copied' ? (
        <Check className="w-3.5 h-3.5" />
      ) : status === 'failed' ? (
        <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
      ) : (
        icon ?? <Share2 className="w-3.5 h-3.5" />
      )}
      {status === 'copied' ? 'Link copied' : status === 'failed' ? "Couldn't share" : label}
    </Button>
  );
};
