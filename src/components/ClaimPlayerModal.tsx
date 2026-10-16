import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader } from 'lucide-react';
import { Game, Player } from '../types/game';
import { Button } from './ui/button';
import { Modal } from './ui/Modal';
import { Checkbox } from './ui/checkbox';
import { claimGamePlayer, findMatchingGames, ClaimMatch } from '../utils/claims';
import { rankPlayers, resolveRanking } from '../utils/playerRanking';
import { formatGameDate } from '../utils/formatGameDate';

type Step = 'confirm' | 'claiming' | 'searching' | 'matches' | 'claiming-matches' | 'done';

interface ClaimPlayerModalProps {
  game: Game;
  player: Player | null;
  userId: string;
  onClose: () => void;
  // Called once this game's claim has gone through, so the page can reload it.
  onClaimed: () => void;
}

const placeLabel = (game: Game, playerId: string) => {
  const entry = rankPlayers(game.players, resolveRanking(game)).find(r => r.player.id === playerId);
  if (!entry) return '';
  return entry.rank === 1 ? (entry.tied ? 'tied for 1st' : 'won') : `finished #${entry.rank}`;
};

export const ClaimPlayerModal = ({ game, player, userId, onClose, onClaimed }: ClaimPlayerModalProps) => {
  const [step, setStep] = useState<Step>('confirm');
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<ClaimMatch[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [claimedCount, setClaimedCount] = useState(0);

  useEffect(() => {
    if (!player) return;
    setStep('confirm');
    setError(null);
    setMatches([]);
    setSelected(new Set());
    setClaimedCount(0);
  }, [player]);

  if (!player) return null;

  const isBusy = step === 'claiming' || step === 'searching' || step === 'claiming-matches';

  const handleClaim = async () => {
    setStep('claiming');
    setError(null);
    try {
      await claimGamePlayer(game.id, player.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not claim this player.');
      setStep('confirm');
      return;
    }
    setClaimedCount(1);
    onClaimed();

    setStep('searching');
    const found = await findMatchingGames(game, player.name, userId);
    if (found.length === 0) {
      setStep('done');
      return;
    }
    setMatches(found);
    setSelected(new Set(found.map(m => m.game.id)));
    setStep('matches');
  };

  const handleClaimMatches = async () => {
    setStep('claiming-matches');
    setError(null);
    let claimed = 0;
    let failed = 0;
    for (const match of matches) {
      if (!selected.has(match.game.id)) continue;
      try {
        await claimGamePlayer(match.game.id, match.playerId);
        claimed++;
      } catch {
        failed++;
      }
    }
    setClaimedCount(count => count + claimed);
    if (failed > 0) {
      setError(`${failed} ${failed === 1 ? "game couldn't" : "games couldn't"} be claimed. Someone may have claimed ${failed === 1 ? 'it' : 'them'} already.`);
    }
    setStep('done');
  };

  const toggle = (gameId: string, checked: boolean) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (checked) next.add(gameId);
      else next.delete(gameId);
      return next;
    });
  };

  return (
    <Modal open={!!player} onClose={isBusy ? () => {} : onClose} closeOnBackdropClick={!isBusy} className="max-w-md">
      {(step === 'confirm' || step === 'claiming') && (
        <>
          <h2 className="text-lg font-bold mb-2">Is {player.name} you?</h2>
          <p className="text-sm text-muted-foreground mb-2">
            {player.name} {placeLabel(game, player.id)} with {player.totalScore} points in {game.name}.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Claiming links this result to your account, so it counts toward your stats, head-to-head records and profile.
          </p>
          {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isBusy}>Cancel</Button>
            <Button onClick={handleClaim} disabled={isBusy}>
              {step === 'claiming' ? 'Claiming…' : "Yes, that's me"}
            </Button>
          </div>
        </>
      )}

      {step === 'searching' && (
        <div className="flex flex-col items-center text-center py-6">
          <Loader className="w-6 h-6 mb-3 text-muted-foreground animate-spin" />
          <p className="text-sm text-muted-foreground">Looking for your other games…</p>
        </div>
      )}

      {(step === 'matches' || step === 'claiming-matches') && (
        <>
          <h2 className="text-lg font-bold mb-2">
            Found {matches.length} more {matches.length === 1 ? 'game' : 'games'} with {player.name}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            These games had a player named {player.name} alongside some of the same people. Uncheck any that weren't you.
          </p>
          <ul className="max-h-72 overflow-y-auto -mx-1 px-1 mb-4 space-y-1">
            {matches.map(match => {
              const matchPlayer = match.game.players.find(p => p.id === match.playerId);
              const others = match.game.players.filter(p => p.id !== match.playerId).map(p => p.name);
              return (
                <li key={match.game.id}>
                  <label className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                    <Checkbox
                      className="mt-0.5"
                      checked={selected.has(match.game.id)}
                      onCheckedChange={v => toggle(match.game.id, v === true)}
                      disabled={step === 'claiming-matches'}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground truncate">
                        {match.game.name}
                        <span className="font-normal text-muted-foreground"> · {formatGameDate(match.game.createdAt)}</span>
                      </span>
                      <span className="block text-xs text-muted-foreground truncate">
                        {matchPlayer?.totalScore ?? 0} pts · with {others.join(', ')}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStep('done')} disabled={step === 'claiming-matches'}>
              Skip
            </Button>
            <Button onClick={handleClaimMatches} disabled={selected.size === 0 || step === 'claiming-matches'}>
              {step === 'claiming-matches'
                ? 'Claiming…'
                : `Claim ${selected.size} ${selected.size === 1 ? 'game' : 'games'}`}
            </Button>
          </div>
        </>
      )}

      {step === 'done' && (
        <>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h2 className="text-lg font-bold">
              {claimedCount === 1 ? 'This game is now yours' : `${claimedCount} games added to your profile`}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            They'll count toward your stats and records from now on.
          </p>
          {error && <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button asChild variant="outline">
              <Link to={`/u/${userId}`}>View profile</Link>
            </Button>
            <Button onClick={onClose}>Done</Button>
          </div>
        </>
      )}
    </Modal>
  );
};
