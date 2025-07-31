import React, { useState } from 'react';
import { ArrowLeft, Plus, X, Users, Play } from 'lucide-react';
import { Player } from '../types/game';

interface PlayerSetupProps {
  onBack: () => void;
  onNext: (players: Player[]) => void;
  isDark: boolean;
}

const PLAYER_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16',
  '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6',
  '#EC4899', '#F43F5E'
];

const generateAvatar = (name: string): string => {
  return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
};

export const PlayerSetup: React.FC<PlayerSetupProps> = ({ onBack, onNext, isDark }) => {
  const [players, setPlayers] = useState<Player[]>([
    {
      id: '1',
      name: '',
      color: PLAYER_COLORS[0],
      avatar: '',
      totalScore: 0,
      roundScores: []
    },
    {
      id: '2',
      name: '',
      color: PLAYER_COLORS[1],
      avatar: '',
      totalScore: 0,
      roundScores: []
    }
  ]);

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
          updated.avatar = generateAvatar(updates.name);
        }
        return updated;
      }
      return p;
    }));
  };

  const handleNext = () => {
    const validPlayers = players.filter(p => p.name.trim());
    if (validPlayers.length < 2) return;
    
    onNext(validPlayers);
  };

  const validPlayers = players.filter(p => p.name.trim());

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-zinc-200 dark:from-stone-900 dark:to-stone-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="p-3 bg-white dark:bg-stone-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <ArrowLeft className="w-6 h-6 text-stone-700 dark:text-stone-300" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-stone-900 dark:text-white">
              Add Players
            </h1>
            <p className="text-stone-600 dark:text-stone-400">
              Add 2-10 players to your game
            </p>
          </div>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {players.map((player, index) => (
            <div
              key={player.id}
              className="bg-white dark:bg-stone-800 rounded-2xl shadow-lg p-6 relative"
            >
              {players.length > 2 && (
                <button
                  onClick={() => removePlayer(player.id)}
                  className="absolute top-4 right-4 p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg"
                  style={{ backgroundColor: player.color }}
                >
                  {player.avatar || (index + 1)}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                    Player {index + 1} Name
                  </label>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => updatePlayer(player.id, { name: e.target.value })}
                    placeholder={`Player ${index + 1}`}
                    className="w-full px-4 py-3 text-lg border border-stone-300 dark:border-stone-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-stone-700 text-stone-900 dark:text-white placeholder-stone-500 dark:placeholder-stone-400"
                  />
                </div>
              </div>
              
              {/* Color Selection */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-3">
                  Player Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {PLAYER_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => updatePlayer(player.id, { color })}
                      className={`w-10 h-10 rounded-full border-4 transition-all duration-200 ${
                        player.color === color
                          ? 'border-stone-900 dark:border-white scale-110'
                          : 'border-stone-300 dark:border-stone-600 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
          
          {/* Add Player Button */}
          {players.length < 10 && (
            <button
              onClick={addPlayer}
              className="bg-white dark:bg-stone-800 rounded-2xl shadow-lg p-6 border-2 border-dashed border-stone-300 dark:border-stone-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-200 flex items-center justify-center"
            >
              <div className="text-center">
                <Plus className="w-12 h-12 text-stone-400 mx-auto mb-2" />
                <span className="text-stone-600 dark:text-stone-400 font-medium">
                  Add Player
                </span>
              </div>
            </button>
          )}
        </div>

        {/* Player Count Summary */}
        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span className="text-lg font-medium text-stone-900 dark:text-white">
                {validPlayers.length} Player{validPlayers.length !== 1 ? 's' : ''} Ready
              </span>
            </div>
            <div className="flex -space-x-2">
              {validPlayers.slice(0, 6).map((player) => (
                <div
                  key={player.id}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium border-2 border-white dark:border-stone-800 shadow-lg"
                  style={{ backgroundColor: player.color }}
                >
                  {player.avatar}
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
          !validPlayers.length < 1 && (
            <button
              onClick={handleNext}
              disabled={validPlayers.length < 2}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:bg-stone-300 dark:disabled:bg-stone-600 text-white px-6 py-4 rounded-xl text-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none disabled:hover:shadow-lg"
            >
              <Play className="w-6 h-6" />
              Start Game
            </button>
          )
        }
      </div>
    </div>
  );
};