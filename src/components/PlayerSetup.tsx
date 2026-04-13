import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Users, Play, UserCheck, ChevronDown } from 'lucide-react';
import { AvatarStyle, Player } from '../types/game';
import { motion, AnimatePresence } from 'framer-motion';
import { FaceAvatar } from './ui/FaceAvatar';
import { ImageAvatar } from './ui/ImageAvatar';
import { TextAvatar } from './ui/TextAvatar';
import { PlayerAvatar } from './ui/PlayerAvatar';
import { generateAvatarSeed } from '../utils/avatar';
import { Profile } from '../hooks/useFriends';

interface PlayerSetupProps {
  onBack: () => void;
  onNext: (players: Player[], avatarStyle: AvatarStyle) => void;
  isDark: boolean;
  friends?: Profile[];
  initialPlayers?: Player[];
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

export const PlayerSetup: React.FC<PlayerSetupProps> = ({ onBack, onNext, isDark: _isDark, friends = [], initialPlayers }) => {
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

    setPlayers([...players, newPlayer]);
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
    setPlayers([...players, newPlayer]);
    setFriendDropdownOpen(false);
  };

  const handleNext = () => {
    const validPlayers = players.filter(p => p.name.trim());
    if (validPlayers.length < 2) return;

    onNext(validPlayers, avatarStyle);
  };

  const validPlayers = players.filter(p => p.name.trim());

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-zinc-200 dark:from-stone-950 dark:to-stone-900 p-4 pb-32">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 mt-20 md:mt-14 lg:mt-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-stone-950 dark:text-white">
              Add Players
            </h1>
          </div>
        </div>

        {/* Avatar Style Selection */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg p-6 mb-6">
          <label className="block text-sm font-medium text-stone-800 dark:text-stone-300 mb-3">
            Avatar Style
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-stone-200 dark:bg-stone-800 p-1 rounded-xl shadow-inner border border-black/5 dark:border-white/5">
            {AVATAR_STYLE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setAvatarStyle(value)}
                className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-all duration-200 ${
                  avatarStyle === value
                    ? 'bg-white dark:bg-stone-950 shadow-sm'
                    : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <span className={`text-sm font-medium ${
                  avatarStyle === value
                    ? 'text-stone-900 dark:text-white font-bold'
                    : 'text-stone-700 dark:text-stone-400 font-normal'
                }`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {players.map((player, index) => (
            <motion.div
              key={player.id}
              className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg p-6 relative"
              initial={{ opacity: 0, bottom: '-16px' }}
              animate={{ opacity: 1, bottom: 0 }}
              exit={{ opacity: 0, bottom: '-16px' }}
              transition={{ duration: 0.12, type: "spring", stiffness: 180 }}
            >
              {players.length > 2 && (
                <button
                  onClick={() => removePlayer(player.id)}
                  className="text-xs inline-flex items-center absolute top-4 right-4 p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                >
                  Remove
                  <X className="w-3 h-3 ml-1" />
                </button>
              )}

              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-lg overflow-hidden relative shrink-0"
                  style={{ backgroundColor: player.color }}
                >
                  <PlayerAvatar player={player} index={index} avatarStyle={avatarStyle} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-stone-800 dark:text-stone-300 mb-2">
                    Player {index + 1} Name
                  </label>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => updatePlayer(player.id, { name: e.target.value })}
                    placeholder={`Player ${index + 1}`}
                    className="w-full px-4 py-3 text-lg border border-stone-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-stone-800 text-stone-950 dark:text-white placeholder-stone-500 dark:placeholder-stone-400"
                  />
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-sm font-medium text-stone-800 dark:text-stone-300 mb-3">
                  Player Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {PLAYER_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => updatePlayer(player.id, { color })}
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-4 transition-all duration-200 transform active:scale-[97%] active:shadow-inner ${
                        player.color === color
                          ? 'border-stone-950 dark:border-white scale-110'
                          : 'border-stone-300 dark:border-stone-600 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Add Player / Add Friend buttons */}
          {players.length < 10 && (
            <div className="flex flex-col gap-3">
              <button
                onClick={addPlayer}
                className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg p-6 border-2 border-dashed border-stone-300 dark:border-stone-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-200 flex items-center justify-center"
              >
                <div className="text-center">
                  <Plus className="w-12 h-12 text-stone-400 mx-auto mb-2" />
                  <span className="text-stone-600 dark:text-stone-400 font-medium">Add Player</span>
                </div>
              </button>

              {availableFriends.length > 0 && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setFriendDropdownOpen(o => !o)}
                    className="w-full bg-white dark:bg-stone-900 rounded-2xl shadow-lg p-4 border-2 border-dashed border-stone-300 dark:border-stone-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-5 h-5 text-stone-400" />
                    <span className="text-stone-600 dark:text-stone-400 font-medium">Add Friend</span>
                    <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${friendDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {friendDropdownOpen && (
                      <motion.ul
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.1 }}
                        className="absolute z-20 mt-1 w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl overflow-hidden"
                      >
                        {availableFriends.map(friend => (
                          <li key={friend.id}>
                            <button
                              onClick={() => addFriendAsPlayer(friend)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-left"
                            >
                              <div className="w-7 h-7 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden flex-shrink-0">
                                {friend.avatar_url
                                  ? <img src={friend.avatar_url} className="w-full h-full" />
                                  : <span className="w-full h-full flex items-center justify-center text-xs font-medium text-stone-500">{friend.email[0].toUpperCase()}</span>
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
          )}
        </div>

        {/* Player Count Summary */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span className="text-lg font-medium text-stone-950 dark:text-white">
                {validPlayers.length} Player{validPlayers.length !== 1 ? 's' : ''} Ready
              </span>
            </div>
            <div className="flex -space-x-2">
              {validPlayers.slice(0, 6).map((player, idx) => (
                <div
                  key={player.id}
                  className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white dark:border-stone-800 shadow-lg overflow-hidden"
                  style={{ backgroundColor: player.color }}
                >
                  <PlayerAvatar player={player} index={idx} avatarStyle={avatarStyle} />
                </div>
              ))}
              {validPlayers.length > 6 && (
                <div className="w-10 h-10 bg-stone-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-stone-800 shadow-lg">
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
                className="grid grid-cols-1 gap-0 fixed bottom-0 left-1/2 -translate-x-1/2 -translate-y-1/2 p-0 rounded-full bg-gradient-to-b from-stone-900/50 to-stone-900/90 dark:from-white/60 dark:to-white border border-stone-700 dark:border-stone-200 text-white dark:text-stone-900 backdrop-blur-md shadow-xl shadow-stone-800/20 dark:shadow-white/20 overflow-hidden w-full max-w-[320px] min-w-[320px] lg:w-auto"
                initial={{ opacity: 0, bottom: 0 }}
                animate={{ opacity: 1, bottom: '8px' }}
                exit={{ opacity: 0, bottom: 0 }}
                transition={{ duration: 0.12, delay: 0.2, type: "spring", stiffness: 180 }}
              >
                <button
                  onClick={handleNext}
                  disabled={validPlayers.length < 2}
                  className="transition p-4 flex items-center justify-center hover:bg-stone-300/10 dark:hover:bg-stone-700/20 active:shadow-inner"
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
