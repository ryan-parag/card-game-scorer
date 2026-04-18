import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Users, Play, UserCheck, ChevronDown, GripVertical } from 'lucide-react';
import { AvatarStyle, Player } from '../types/game';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import HoverShim from './ui/HoverShim';
import { PlayerAvatar } from './ui/PlayerAvatar';
import { generateAvatarSeed } from '../utils/avatar';
import { Profile } from '../hooks/useFriends';
import { LeagueMember } from '../hooks/useLeagues';
import { Button } from './ui/Button';

interface PlayerSetupProps {
  onBack: () => void;
  onNext: (players: Player[], avatarStyle: AvatarStyle) => void;
  isDark: boolean;
  friends?: Profile[];
  initialPlayers?: Player[];
  leagueMembers?: LeagueMember[];
}

const PLAYER_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16',
  '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6',
  '#EC4899', '#F43F5E'
];

const AVATAR_STYLE_OPTIONS: { value: AvatarStyle; label: string }[] = [
  { value: 'abstract', label: 'Abstract' },
  { value: 'text', label: 'Text' },
  { value: 'f1', label: 'Drivers' },
  { value: 'corp', label: 'Business' },
];

const PREVIEW_COLOR = '#3B82F6';

const PlayerCard: React.FC<{
  player: Player;
  index: number;
  avatarStyle: AvatarStyle;
  canRemove: boolean;
  onRemove: () => void;
  onUpdate: (updates: Partial<Player>) => void;
}> = ({ player, index, avatarStyle, canRemove, onRemove, onUpdate }) => {
  const controls = useDragControls();
  const [open, setOpen] = useState(false);
  return (
    <Reorder.Item
      value={player}
      dragListener={false}
      dragControls={controls}
      className="bg-card border border-border rounded-2xl shadow-lg p-6 relative list-none"
    >
      <div className="flex items-start gap-2">
        <div
          onPointerDown={(e) => controls.start(e)}
          className="mt-2 p-1.5 rounded-lg cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground hover:bg-muted transition-colors select-none shrink-0"
          title="Drag to reorder"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        <div className="flex-1">
          {canRemove && (
            <button
              onClick={onRemove}
              className="text-xs inline-flex items-center absolute top-4 right-4 p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
            >
              Remove
              <X className="w-3 h-3 ml-1" />
            </button>
          )}

          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg overflow-hidden relative shrink-0"
              style={{ backgroundColor: player.color }}
            >
              <PlayerAvatar player={player} index={index} avatarStyle={avatarStyle} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-1">
                Player {index + 1} Name
              </label>
              <input
                type="text"
                value={player.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder={`Player ${index + 1}`}
                className="w-full px-3 py-2 text-base border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-card text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2 text-sm">
              <span>
                Player Color
              </span>
              <span className={`w-4 h-4 rounded-full`} style={{ background: player.color}}/>
              <button
                onClick={() => setOpen(!open)}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition"
              >
                {open ? 'Hide' : 'Show'}
                <ChevronDown size={16} className={`transition transform ${open ? 'rotate-0' : '-rotate-90'}`}/>
              </button>
            </div>
            {
              open && (
                <div className="flex flex-wrap gap-2">
                  {PLAYER_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => onUpdate({ color })}
                      className={`w-8 h-8 rounded-full border-4 transition-all duration-200 transform active:scale-[97%] active:shadow-inner ${
                        player.color === color ? 'border-foreground scale-110' : 'border-input hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )
            }
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
};

export const PlayerSetup: React.FC<PlayerSetupProps> = ({ onBack, onNext, isDark: _isDark, friends = [], initialPlayers, leagueMembers }) => {
  const [players, setPlayers] = useState<Player[]>(() => {
    if (initialPlayers && initialPlayers.length >= 2) return initialPlayers;
    return [
      { id: '1', name: '', color: PLAYER_COLORS[0], avatar: '', totalScore: 0, roundScores: [] },
      { id: '2', name: '', color: PLAYER_COLORS[1], avatar: '', totalScore: 0, roundScores: [] },
    ];
  });
  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle>('abstract');
  const [friendDropdownOpen, setFriendDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);


  // Prop is currently only used to mirror theme state at the app level (Tailwind `dark:` classes handle styling).
  void _isDark;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setFriendDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addPlayer = () => {
    if (players.length >= 10) return;

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: '',
      color: PLAYER_COLORS[players.length % PLAYER_COLORS.length],
      avatar: '',
      totalScore: 0,
      roundScores: []
    };

    setPlayers([newPlayer, ...players]);
  };

  const removePlayer = (id: string) => {
    if (players.length <= 2) return;
    setPlayers(players.filter(p => p.id !== id));
  };

  const updatePlayer = (id: string, updates: Partial<Player>) => {
    setPlayers(players.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        if (updates.name !== undefined) {
          updated.avatar = generateAvatarSeed(updates.name);
        }
        return updated;
      }
      return p;
    }));
  };

  // Friends not already added as players
  const availableFriends = friends.filter(
    f => !players.some(p => p.name === (f.email.split('@')[0]))
  );

  // League members not already in the players list (matched by user_id → player.id)
  const availableLeagueMembers = (leagueMembers ?? []).filter(
    m => !players.some(p => p.id === m.user_id)
  );

  const addFriendAsPlayer = (friend: Profile) => {
    if (players.length >= 10) return;
    const name = friend.email.split('@')[0];
    const newPlayer: Player = {
      id: friend.id,
      name,
      color: PLAYER_COLORS[players.length % PLAYER_COLORS.length],
      avatar: generateAvatarSeed(name),
      totalScore: 0,
      roundScores: [],
    };
    setPlayers([newPlayer, ...players]);
    setFriendDropdownOpen(false);
  };

  const addLeagueMemberAsPlayer = (member: LeagueMember) => {
    if (players.length >= 10) return;
    const name = member.profile.display_name ?? member.profile.email.split('@')[0];
    const newPlayer: Player = {
      id: member.user_id,
      name,
      color: PLAYER_COLORS[players.length % PLAYER_COLORS.length],
      avatar: generateAvatarSeed(name),
      totalScore: 0,
      roundScores: [],
    };
    setPlayers([newPlayer, ...players]);
  };

  const handleNext = () => {
    const validPlayers = players.filter(p => p.name.trim());
    if (validPlayers.length < 2) return;

    onNext(validPlayers, avatarStyle);
  };

  const validPlayers = players.filter(p => p.name.trim());

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary p-4 pb-32">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 mt-20 md:mt-14 lg:mt-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Add Players
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-8">
          {/* Combined league quick-add + add player — shown when a league is attached */}
          {leagueMembers && players.length < 10 && (
            <div className="bg-card border border-border rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-foreground">Add from league</p>
                <button
                  onClick={addPlayer}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-input bg-muted text-sm text-foreground hover:text-foreground transition-all duration-150 relative group overflow-hidden active:scale-[97%] group"
                >
                  <HoverShim />
                  <Plus className="w-3.5 h-3.5" />
                  Add Player
                </button>
              </div>
              {availableLeagueMembers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableLeagueMembers.map(member => {
                    const name = member.profile.display_name ?? member.profile.email.split('@')[0];
                    return (
                      <button
                        key={member.user_id}
                        onClick={() => addLeagueMemberAsPlayer(member)}
                        disabled={players.length >= 10}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-input bg-muted transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none relative group overflow-hidden active:scale-[97%]"
                      >
                        <HoverShim />
                        <div className="w-5 h-5 rounded-full bg-muted-foreground/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {member.profile.avatar_url
                            ? <img src={member.profile.avatar_url} className="w-full h-full object-cover" alt={name} />
                            : <span className="text-[10px] font-semibold text-muted-foreground">{name[0]?.toUpperCase()}</span>
                          }
                        </div>
                        <span className="text-sm text-foreground">{name}</span>
                        <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">All league members have been added.</p>
              )}
            </div>
          )}

          {/* Standalone add player card — shown when no league is attached */}
          {!leagueMembers && players.length < 10 && (
            <button
              onClick={addPlayer}
              className="bg-card rounded-2xl shadow-lg p-6 border-2 border-dashed border-input hover:border-black/40 hover:dark:border-white/40  transition-all duration-200 flex items-center justify-center overflow-hidden group relative"
            >
              <div className="text-center">
                <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <span className="text-muted-foreground font-medium">Add Player</span>
              </div>
              <HoverShim/>
            </button>
          )}

          {/* Add Friend dropdown */}
          {players.length < 10 && availableFriends.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setFriendDropdownOpen(o => !o)}
                className="w-full bg-card rounded-2xl shadow-lg p-4 border-2 border-dashed border-input hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <UserCheck className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground font-medium">Add Friend</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${friendDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {friendDropdownOpen && (
                  <motion.ul
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.1 }}
                    className="absolute z-20 mt-1 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden"
                  >
                    {availableFriends.map(friend => (
                      <li key={friend.id}>
                        <button
                          onClick={() => addFriendAsPlayer(friend)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors text-left"
                        >
                          <div className="w-7 h-7 rounded-full bg-muted overflow-hidden flex-shrink-0">
                            {friend.avatar_url
                              ? <img src={friend.avatar_url} className="w-full h-full" />
                              : <span className="w-full h-full flex items-center justify-center text-xs font-medium text-muted-foreground">{friend.email[0].toUpperCase()}</span>
                            }
                          </div>
                          {friend.email}
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Players list */}
        <Reorder.Group
          as="div"
          axis="y"
          values={players}
          onReorder={setPlayers}
          className="flex flex-col gap-6 mb-8"
        >
          {players.map((player, index) => (
            <PlayerCard
              key={player.id}
              player={player}
              index={index}
              avatarStyle={avatarStyle}
              canRemove={players.length > 2}
              onRemove={() => removePlayer(player.id)}
              onUpdate={(updates) => updatePlayer(player.id, updates)}
            />
          ))}
        </Reorder.Group>

        {/* Avatar Style Selection */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-6 mb-6">
          <label className="block text-sm font-medium text-foreground mb-3">
            Avatar Style
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-muted p-1 rounded-xl shadow-inner border border-black/5 dark:border-white/5">
            {AVATAR_STYLE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setAvatarStyle(value)}
                className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-all duration-200 ${
                  avatarStyle === value
                    ? 'bg-background shadow-sm'
                    : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <span className={`text-sm font-medium ${
                  avatarStyle === value
                    ? 'text-foreground font-bold'
                    : 'text-muted-foreground font-normal'
                }`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Player Count Summary */}
        <div className="bg-card rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span className="text-lg font-medium text-foreground">
                {validPlayers.length} Player{validPlayers.length !== 1 ? 's' : ''} Ready
              </span>
            </div>
            <div className="flex -space-x-2">
              {validPlayers.slice(0, 6).map((player, idx) => (
                <div
                  key={player.id}
                  className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-background shadow-lg overflow-hidden"
                  style={{ backgroundColor: player.color }}
                >
                  <PlayerAvatar player={player} index={idx} avatarStyle={avatarStyle} />
                </div>
              ))}
              {validPlayers.length > 6 && (
                <div className="w-10 h-10 bg-muted-foreground rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-background shadow-lg">
                  +{validPlayers.length - 6}
                </div>
              )}
            </div>
          </div>
        </div>

        {
          validPlayers.length > 0 && (
            <AnimatePresence>
              <motion.div
                className="grid grid-cols-1 gap-0 fixed bottom-0 left-1/2 -translate-x-1/2 -translate-y-1/2 p-0 rounded-full fixed-button overflow-hidden w-full max-w-[320px] min-w-[320px] lg:w-auto"
                initial={{ opacity: 0, bottom: 0 }}
                animate={{ opacity: 1, bottom: '8px' }}
                exit={{ opacity: 0, bottom: 0 }}
                transition={{ duration: 0.12, delay: 0.2, type: "spring", stiffness: 180 }}
              >
                <button
                  onClick={handleNext}
                  disabled={validPlayers.length < 2}
                  className="transition p-4 flex items-center justify-center fixed-button-inner active:shadow-inner"
                >
                  <Play className="w-6 h-6" />
                  <span className="ml-2 font-medium">Start Game</span>
                </button>
              </motion.div>
            </AnimatePresence>
          )
        }
      </div>
    </div>
  );
};
