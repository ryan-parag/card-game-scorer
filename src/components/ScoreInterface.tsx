import React, { useState, useEffect } from 'react';
import { RotateCcw, Trophy, ChevronRight, CircleDashed, ArrowUp, ArrowDown, GripVertical, Plus } from 'lucide-react';
import { Game, Player } from '../types/game';
import { resolveRanking, sortPlayersByRanking } from '../utils/playerRanking';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { motion, Reorder, useDragControls } from 'framer-motion'
import { PlayerAvatar } from './ui/PlayerAvatar';
import NumberFlow from '@number-flow/react';
import NumberInput from './ui/NumberInput';
import { LeagueMember } from '../hooks/useLeagues';
import { generateAvatarSeed } from '../utils/avatar';
import HoverShim from './ui/HoverShim';


const EditPlayerRow: React.FC<{
  player: Player;
  canRemove: boolean;
  onRemove: () => void;
  onUpdate: (updates: Partial<Player>) => void;
}> = ({ player, canRemove, onRemove, onUpdate }) => {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={player}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-2 list-none"
    >
      <div
        onPointerDown={(e) => controls.start(e)}
        className="p-1.5 rounded-lg cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground hover:bg-muted transition-colors select-none shrink-0"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <Input
        type="text"
        value={player.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        className="flex-1 py-2 lg:py-2 text-sm lg:text-sm"
      />
      <Button variant="outline" onClick={onRemove} disabled={!canRemove}>Remove</Button>
    </Reorder.Item>
  );
};

interface ScoreInterfaceProps {
  game: Game;
  onUpdateScore: (playerId: string, roundIndex: number, score: number) => void;
  onUpdateProposedScore: (playerId: string, score: number | undefined) => void;
  onSetMaxRounds: (newMaxRounds: number) => void;
  onSetCollectProposedScores: (collectProposedScores: boolean) => void;
  onSetRanking: (ranking: Game['ranking']) => void;
  onNextRound: () => void;
  onCompleteGame: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onBack: () => void;
  onGoToRound: (roundNumber: number) => void;
  onAddPlayer: () => void;
  onRemovePlayer: (playerId: string) => void;
  onUpdatePlayer: (playerId: string, updates: Partial<Game['players'][number]>) => void;
  onReorderPlayers: (players: Player[]) => void;
  isDark: boolean;
  leagueMembers?: LeagueMember[];
}

export const ScoreInterface: React.FC<ScoreInterfaceProps> = ({
  game,
  onUpdateScore,
  onUpdateProposedScore,
  onSetMaxRounds,
  onSetCollectProposedScores,
  onSetRanking,
  onNextRound,
  onCompleteGame,
  onUndo,
  canUndo,
  onBack,
  onGoToRound,
  onAddPlayer,
  onRemovePlayer,
  onUpdatePlayer,
  onReorderPlayers,
  leagueMembers,
}) => {
  const [showingProposed, setShowingProposed] = useState(
    game.collectProposedScores && game.currentRound < game.maxRounds
  );
  const [isEditingPlayers, setIsEditingPlayers] = useState(false);
  const [isSettingRounds, setIsSettingRounds] = useState(false);
  const [isEditingScoringMethod, setIsEditingScoringMethod] = useState(false);
  const [selectedRanking, setSelectedRanking] = useState<Game['ranking']>(resolveRanking(game));
  const [roundsInput, setRoundsInput] = useState(game.maxRounds);

  useEffect(() => {
    if (!game.collectProposedScores) {
      setShowingProposed(false);
    }
  }, [game.collectProposedScores]);

  useEffect(() => {
    if (isEditingScoringMethod) {
      setSelectedRanking(resolveRanking(game));
    }
  }, [isEditingScoringMethod, game]);

  const handleNextPhase = () => {
    if (showingProposed) {
      setShowingProposed(false);
    } else if (game.currentRound < game.maxRounds) {
      onNextRound();
      if (game.collectProposedScores) {
        setShowingProposed(true);
      }
    } else {
      onCompleteGame();
    }
  };

  const handleRoundClick = (roundNumber: number) => {
    // Only allow clicking on completed rounds (rounds that have been played)
    if (roundNumber <= game.currentRound - 1) {
      onGoToRound(roundNumber);
    }
  };

  const canProceed = showingProposed 
    ? game.players.every(p => p.proposedScore !== undefined && p.proposedScore !== null && p.proposedScore >= 0)
    : game.players.every(p => p.roundScores[game.currentRound - 1] !== undefined);

  const sortedPlayers = sortPlayersByRanking(game.players, resolveRanking(game));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-4">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 mt-20 md:mt-14">
          <div className="flex flex-col items-start gap-4">
            <div>
              <div className="flex items-center">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {game.name}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                <div className="text-sm text-muted-foreground">Round {game.currentRound} of {game.maxRounds}</div>
                <div className="px-1 py-0.5 rounded-sm inline-flex items-center text-xs bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400">
                  <CircleDashed className="w-4 h-4 mr-1" />
                  In Progress
                </div>
                <span className="text-xs text-muted-foreground w-full sm:w-auto">
                  {resolveRanking(game) === 'low-wins' ? 'Lowest score wins' : 'Highest score wins'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-card rounded-xl p-4 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Game Progress
            </span>
            <span className="text-sm text-muted-foreground">
              <NumberFlow value={Math.round((game.currentRound / game.maxRounds) * 100)} />%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(game.currentRound / game.maxRounds) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Score Grid */}
        <div className="flex flex-col sm:flex-row justify-between mb-6">
          <div className="flex items-center gap-0">
            <Button
              onClick={onUndo}
              disabled={!canUndo}
              variant="outline"
              size="icon"
              className="p-3 bg-card transition-all duration-200 disabled:opacity-50 rounded-r-none h-10"
            >
              <RotateCcw className="w-6 h-6 text-foreground" />
            </Button>
            <Button
              variant="outline"
              onClick={() => { setRoundsInput(game.maxRounds); setIsSettingRounds(true); }}
              className="p-3 bg-card transition-all duration-200 disabled:opacity-50 rounded-none border-x-0"
            >
              Edit Rounds
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditingScoringMethod(true)}
              className="p-3 bg-card transition-all duration-200 disabled:opacity-50 rounded-none border-x-0"
            >
              {game.collectProposedScores ? 'Bid & Score' : 'Simple'}
              &nbsp;
              {game.ranking === 'high-wins' ? <ArrowUp size={16}/> : <ArrowDown size={16}/> }
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditingPlayers(true)}
              className="p-3 bg-card transition-all duration-200 disabled:opacity-50 rounded-l-none"
            >
              {game.players.length} Players
            </Button>
          </div>
          <div className="flex mt-2 sm:mt-0 flex-col md:flex-row items-center gap-1">
          </div>
        </div>
        {
          showingProposed && (
            <h4 className="font-bold text-xl mb-4">Collecting Bids - Round {game.currentRound} of {game.maxRounds}</h4>
          )
        }
        <div className="bg-card rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="overflow-x-auto overflow-y-hidden relative">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="sticky left-0 z-10 bg-muted min-w-[120px] lg:min-w-[180px]">
                    Player
                  </TableHead>
                  {showingProposed ? (
                    <TableHead className="text-center">
                      Bid
                    </TableHead>
                  ) : (
                    <>
                      {Array.from({ length: game.maxRounds }, (_, i) => (
                        <TableHead
                          key={i}
                          className={`text-center min-w-[80px] transition-colors ${
                            i === game.currentRound - 1 ? 'bg-blue-100 dark:bg-blue-900' : ''
                          } ${i <= game.currentRound - 1 ? 'cursor-pointer hover:bg-muted hover:scale-105 transform' : 'opacity-50 cursor-not-allowed'}`}
                          onClick={() => handleRoundClick(i + 1)}
                          title={i <= game.currentRound - 1 ? `Click to edit Round ${i + 1} scores` : `Round ${i + 1} not yet played`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>R{i + 1}</span>
                            {i <= game.currentRound - 1 && i < game.currentRound - 1 && (
                              <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                            )}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="text-center bg-muted text-foreground sticky right-0 z-10 min-w-[80px]">
                        Total
                      </TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {game.players.map((player, playerIndex) => (
                  <TableRow
                    key={player.id}
                    className={`${
                      playerIndex % 2 === 0 ? 'bg-card' : 'bg-secondary'
                    }`}
                  >
                    <TableCell className="sticky left-0 z-0 bg-inherit border-r border-border">
                      <div className="flex items-center gap-3">
                        <div
                          className="hidden md:w-8 md:h-8 md:text-sm md:font-semibold lg:font-bold lg:text-base lg:w-10 lg:h-10 rounded-full md:flex items-center justify-center text-white"
                          style={{ backgroundColor: player.color }}
                        >
                      <PlayerAvatar player={player} index={playerIndex} avatarStyle={game.avatarStyle} />
                        </div>
                        <span className="font-medium text-foreground">
                          {player.name}
                          {
                            showingProposed ? (
                              <>
                                <br/>
                                <span className="text-xs font-normal text-muted-foreground">Total score: {player.totalScore}</span>
                              </>
                            ) : (
                              <>
                                <br/>
                                <span className="text-xs font-normal text-muted-foreground">Last bid: {player.proposedScore !== undefined && player.proposedScore !== null ? player.proposedScore : '-'}</span>
                              </>
                            )
                          }
                        </span>
                      </div>
                    </TableCell>
                    
                    {showingProposed ? (
                      <TableCell className="p-1 min-w-20 max-w-24">
                        <div className="bidCell flex items-center justify-center gap-2 h-16">
                          <Input
                            type="tel"
                            value={player.proposedScore !== undefined && player.proposedScore !== null ? player.proposedScore : ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                onUpdateProposedScore(player.id, undefined);
                              } else {
                                const numValue = parseInt(value);
                                if (!isNaN(numValue)) {
                                  onUpdateProposedScore(player.id, numValue);
                                }
                              }
                            }}
                            placeholder="0"
                            className="w-full h-full rounded-none text-center text-xl font-bold text-foreground"
                          />
                        </div>
                      </TableCell>
                    ) : (
                      <>
                        {Array.from({ length: game.maxRounds }, (_, roundIndex) => (
                          <TableCell
                            key={roundIndex}
                            className={`text-center p-1 min-w-20 max-w-24 ${
                              roundIndex === game.currentRound - 1 ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                          >
                            {roundIndex <= game.currentRound - 1 ? (
                              <div className="h-full flex items-center justify-center gap-1">
                                <Input
                                  type="tel"
                                  value={player.roundScores[roundIndex] ?? ''}
                                  onChange={(e) => {
                                    const inputValue = e.target.value;
                                    const parsedValue = parseInt(inputValue, 10);
                                    if (inputValue === '') {
                                      onUpdateScore(player.id, roundIndex, 0);
                                    } else if (!Number.isNaN(parsedValue)) {
                                      onUpdateScore(player.id, roundIndex, parsedValue);
                                    }
                                  }}
                                  className="w-full h-16 rounded-none text-lg font-bold text-foreground"
                                />
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                {player.roundScores[roundIndex] || '-'}
                              </span>
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="text-center sticky right-0 z-0 bg-inherit border-l border-border">
                          <span className="text-xl font-bold text-foreground">
                            <NumberFlow value={player.totalScore} />
                          </span>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Actions */}
        {
          canProceed && (
            <motion.div
              className="grid grid-cols-1 gap-0 fixed left-1/2 -translate-x-1/2 -translate-y-1/2 p-0 rounded-full fixed-button overflow-hidden w-full max-w-[320px] lg:w-auto min-w-[280px]"
              initial={{ opacity: 0, bottom: 0 }}
              animate={{ opacity: 1, bottom: '8px' }}
              exit={{ opacity: 0, bottom: 0 }}
              transition={{ duration: 0.12, delay: 0.2, type: "spring", stiffness: 180 }}
            >
                <button
                  onClick={handleNextPhase}
                  className="transition p-4 flex items-center justify-center fxied-button-inner"
                  disabled={!canProceed}
                >
                  {showingProposed ? (
                      <>
                        <span className="mr-1 font-semibold">Continue to Scoring</span>
                        <ChevronRight className="w-6 h-6" />
                      </>
                    ) : game.currentRound < game.maxRounds ? (
                      <>
                        <span className="mr-1 font-semibold">Next Round</span>
                        <ChevronRight className="w-6 h-6" />
                      </>
                    ) : (
                      <>
                        <span className="mr-1 font-semibold">Complete Game</span>
                        <Trophy className="w-6 h-6" />
                      </>
                    )}
                </button>
              </motion.div>
          )
        }

        {/* Leaderboard */}
        {!showingProposed && (
          <div className="bg-card rounded-2xl shadow-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Current Standings
            </h3>
            <div className="space-y-3">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-4 px-4 py-2 rounded-xl ${
                    index === 0
                      ? 'bg-yellow-100 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-600'
                      : 'bg-secondary'
                  }`}
                >
                  <div className={`text-xl font-bold ${
                    index === 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'
                  }`}>
                    #<NumberFlow value={index + 1} />
                  </div>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                    style={{ backgroundColor: player.color }}
                  >
                    <PlayerAvatar player={player} index={index} avatarStyle={game.avatarStyle} />
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <div className="font-semibold text-foreground">
                      {player.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <NumberFlow value={player.totalScore} /> points
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {isEditingPlayers && (() => {
        const availableLeagueMembers = (leagueMembers ?? []).filter(
          m => !game.players.some(p => p.id === m.user_id)
        );
        const PLAYER_COLORS = [
          '#EF4444', '#F97316', '#F59E0B', '#84CC16',
          '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6',
          '#EC4899', '#F43F5E',
        ];
        const addLeagueMember = (member: LeagueMember) => {
          if (game.players.length >= 10) return;
          const name = member.profile.display_name ?? member.profile.email.split('@')[0];
          const newPlayer: Player = {
            id: member.user_id,
            name,
            color: PLAYER_COLORS[game.players.length % PLAYER_COLORS.length],
            avatar: generateAvatarSeed(name),
            totalScore: 0,
            roundScores: [],
          };
          onUpdatePlayer(newPlayer.id, newPlayer);
          // Use onAddPlayer pattern: inject via a direct reorder call with appended player
          onReorderPlayers([...game.players, newPlayer]);
        };
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Edit Players</h2>
              </div>
              <Reorder.Group
                as="div"
                axis="y"
                values={game.players}
                onReorder={onReorderPlayers}
                className="space-y-2 mb-4"
              >
                {game.players.map((p) => (
                  <EditPlayerRow
                    key={p.id}
                    player={p}
                    canRemove={game.players.length > 2}
                    onRemove={() => onRemovePlayer(p.id)}
                    onUpdate={(updates) => onUpdatePlayer(p.id, updates)}
                  />
                ))}
              </Reorder.Group>

              {/* League members quick-add */}
              {leagueMembers && game.players.length < 10 && (
                <div className="border border-border rounded-xl p-3 mb-4 bg-secondary/40">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add from league</p>
                    <button
                      onClick={onAddPlayer}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-input bg-muted text-xs text-muted-foreground hover:text-foreground transition-all duration-150 relative group overflow-hidden active:scale-[97%]"
                    >
                      <HoverShim />
                      <Plus className="w-3 h-3" />
                      Add Player
                    </button>
                  </div>
                  {availableLeagueMembers.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {availableLeagueMembers.map(member => {
                        const name = member.profile.display_name ?? member.profile.email.split('@')[0];
                        return (
                          <button
                            key={member.user_id}
                            onClick={() => addLeagueMember(member)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-input bg-muted text-xs transition-all duration-150 relative group overflow-hidden active:scale-[97%]"
                          >
                            <HoverShim />
                            <div className="w-4 h-4 rounded-full bg-muted-foreground/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {member.profile.avatar_url
                                ? <img src={member.profile.avatar_url} className="w-full h-full object-cover" alt={name} />
                                : <span className="text-[9px] font-semibold text-muted-foreground">{name[0]?.toUpperCase()}</span>
                              }
                            </div>
                            <span className="text-foreground">{name}</span>
                            <Plus className="w-3 h-3 text-muted-foreground" />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">All league members have been added.</p>
                  )}
                </div>
              )}

              <div className="flex justify-between">
                {!leagueMembers && (
                  <Button variant="outline" onClick={onAddPlayer}>Add Player</Button>
                )}
                {leagueMembers && <div />}
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setIsEditingPlayers(false)}>Cancel</Button>
                  <Button onClick={() => setIsEditingPlayers(false)}>Save</Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {isEditingScoringMethod && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Scoring &amp; leaderboard</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              You can switch anytime. Turning off Bid &amp; Score clears any bids in progress.
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Scoring method
            </p>
            <div className="grid grid-cols-1 gap-3 mb-6">
              <Button
                type="button"
                onClick={() => onSetCollectProposedScores(false)}
                variant={!game.collectProposedScores ? 'default' : 'outline'}
                className="h-auto flex-col py-4 px-4 items-stretch text-left"
              >
                <div className="font-bold">Simple Scoring</div>
                <div className="text-xs opacity-75 font-normal">
                  Enter final scores at the end of each round
                </div>
              </Button>
              <Button
                type="button"
                onClick={() => onSetCollectProposedScores(true)}
                variant={game.collectProposedScores ? 'default' : 'outline'}
                className="h-auto flex-col py-4 px-4 items-stretch text-left"
              >
                <div className="font-bold">Bid &amp; Score</div>
                <div className="text-xs opacity-75 font-normal">
                  Collect proposed scores before rounds, then actual scores after
                </div>
              </Button>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Leaderboard
            </p>
            <div className="grid grid-cols-1 gap-3">
              <Button
                type="button"
                onClick={() => setSelectedRanking('high-wins')}
                variant={selectedRanking === 'high-wins' ? 'default' : 'outline'}
                className="h-auto flex-col py-4 px-4 items-stretch text-left"
              >
                <div className="font-bold">Highest score wins</div>
                <div className="text-xs opacity-75 font-normal">Standings favor the most points</div>
              </Button>
              <Button
                type="button"
                onClick={() => setSelectedRanking('low-wins')}
                variant={selectedRanking === 'low-wins' ? 'default' : 'outline'}
                className="h-auto flex-col py-4 px-4 items-stretch text-left"
              >
                <div className="font-bold">Lowest score wins</div>
                <div className="text-xs opacity-75 font-normal">Standings favor the fewest points (e.g. golf)</div>
              </Button>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditingScoringMethod(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  onSetRanking(selectedRanking);
                  setIsEditingScoringMethod(false);
                }}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
      {isSettingRounds && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Set Total Rounds</h2>
            </div>
            <div className="space-y-3 flex text-center flex-col items-center p-4 bg-black/5 dark:bg-white/5 rounded-lg">
              <label className="block text-sm font-medium text-foreground">Number of Rounds</label>
              <NumberInput
                value={roundsInput}
                onChange={setRoundsInput}
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsSettingRounds(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  if (Number.isFinite(roundsInput)) {
                    onSetMaxRounds(roundsInput);
                    setIsSettingRounds(false);
                  }
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};