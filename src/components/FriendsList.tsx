import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CircleUserRound, Loader, MoreHorizontal, Search, UserMinus, UserRound, Users, X } from 'lucide-react';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Friendship, FriendsState, Profile, profileName } from '@/hooks/useFriends';

// Show the filter box once the list is long enough to need it.
const FILTER_THRESHOLD = 8;

export function FriendAvatar({ profile, size = 'md' }: { profile: Profile; size?: 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  return (
    <div className={`${dims} rounded-full overflow-hidden bg-muted flex-shrink-0`}>
      {profile.avatar_url
        ? <img src={profile.avatar_url} alt={profileName(profile)} className="w-full h-full object-cover" />
        : <CircleUserRound className="w-full h-full p-1 text-muted-foreground" />}
    </div>
  );
}

function SectionHeading({ label, count }: { label: string; count: number }) {
  return (
    <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
      {label}
      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] leading-none tabular-nums">{count}</span>
    </p>
  );
}

function Row({ profile, subtitle, children, highlight }: {
  profile: Profile;
  subtitle?: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
      transition={{ duration: 0.15 }}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 overflow-hidden ${highlight ? 'bg-secondary py-3' : ''}`}
    >
      <FriendAvatar profile={profile} size={highlight ? 'lg' : 'md'} />
      <div className="flex-1 min-w-0">
        <Link to={`/u/${profile.id}`} className="text-sm font-medium text-foreground hover:underline truncate block">
          {profileName(profile)}
        </Link>
        {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">{children}</div>
    </motion.li>
  );
}

interface FriendsListProps {
  state: FriendsState;
  /** Rendered in the empty state, e.g. a link or button to go find people. */
  emptyAction?: React.ReactNode;
}

export function FriendsList({ state, emptyAction }: FriendsListProps) {
  const { friends, pendingReceived, pendingSent, loading, error, acceptRequest, declineRequest, cancelRequest, removeFriend } = state;

  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [filter, setFilter] = useState('');

  const run = async (id: string, action: (id: string) => Promise<string | null>) => {
    setBusyId(id);
    setActionError('');
    const err = await action(id);
    if (err) setActionError(err);
    setBusyId(null);
    setConfirmRemoveId(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-sm text-red-500">{error}</p>
        <Button size="sm" variant="outline" onClick={() => state.reload()}>Try again</Button>
      </div>
    );
  }

  if (friends.length === 0 && pendingReceived.length === 0 && pendingSent.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
        <Users className="w-8 h-8" />
        <div>
          <p className="text-sm font-medium text-foreground">No friends yet</p>
          <p className="text-sm">Add friends to see their profiles and add them to games and leagues faster.</p>
        </div>
        {emptyAction}
      </div>
    );
  }

  const q = filter.trim().toLowerCase();
  const visibleFriends = q
    ? friends.filter(f => profileName(f.profile).toLowerCase().includes(q) || f.profile.email.toLowerCase().includes(q))
    : friends;

  const renderFriendActions = (f: Friendship) => {
    const busy = busyId === f.id;
    if (confirmRemoveId === f.id) {
      return (
        <>
          <Button size="xs" variant="outline" onClick={() => setConfirmRemoveId(null)} disabled={busy}>
            Keep
          </Button>
          <Button size="xs" variant="destructive" onClick={() => run(f.id, removeFriend)} disabled={busy}>
            {busy ? <Loader className="w-3.5 h-3.5 animate-spin" /> : 'Remove'}
          </Button>
        </>
      );
    }
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="xs" variant="ghost" aria-label={`Options for ${profileName(f.profile)}`}>
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to={`/u/${f.profile.id}`}>
              <UserRound className="w-4 h-4" />
              View profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => setConfirmRemoveId(f.id)}>
            <UserMinus className="w-4 h-4" />
            Remove friend
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {actionError && <p className="text-sm text-red-500">{actionError}</p>}

      {pendingReceived.length > 0 && (
        <section>
          <SectionHeading label="Requests" count={pendingReceived.length} />
          <ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {pendingReceived.map(f => {
                const busy = busyId === f.id;
                return (
                  <Row key={f.id} profile={f.profile} subtitle={`Wants to be friends · ${moment(f.created_at).fromNow()}`} highlight>
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label={`Decline ${profileName(f.profile)}`}
                      onClick={() => run(f.id, declineRequest)}
                      disabled={busy}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="default" onClick={() => run(f.id, acceptRequest)} disabled={busy} className="gap-1.5">
                      {busy ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Accept
                    </Button>
                  </Row>
                );
              })}
            </AnimatePresence>
          </ul>
        </section>
      )}

      {friends.length > 0 && (
        <section>
          <SectionHeading label="Friends" count={friends.length} />
          {friends.length > FILTER_THRESHOLD && (
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Filter friends…"
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="!pl-9 !px-3 !py-2 !text-sm"
                autoComplete="off"
              />
            </div>
          )}
          <ul className="flex flex-col">
            <AnimatePresence initial={false}>
              {visibleFriends.map(f => (
                <Row
                  key={f.id}
                  profile={f.profile}
                  subtitle={confirmRemoveId === f.id ? `Remove ${profileName(f.profile)} from your friends?` : undefined}
                >
                  {renderFriendActions(f)}
                </Row>
              ))}
            </AnimatePresence>
          </ul>
          {q && visibleFriends.length === 0 && (
            <p className="text-sm text-muted-foreground px-3 py-2">No friends match "{filter.trim()}"</p>
          )}
        </section>
      )}

      {pendingSent.length > 0 && (
        <section>
          <SectionHeading label="Sent" count={pendingSent.length} />
          <ul className="flex flex-col">
            <AnimatePresence initial={false}>
              {pendingSent.map(f => {
                const busy = busyId === f.id;
                return (
                  <Row key={f.id} profile={f.profile} subtitle={`Requested ${moment(f.created_at).fromNow()}`}>
                    <Button size="xs" variant="ghost" onClick={() => run(f.id, cancelRequest)} disabled={busy} className="text-muted-foreground">
                      {busy ? <Loader className="w-3.5 h-3.5 animate-spin" /> : 'Cancel'}
                    </Button>
                  </Row>
                );
              })}
            </AnimatePresence>
          </ul>
        </section>
      )}
    </div>
  );
}
