import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Sparkles } from 'lucide-react';
import { AvatarStyle, Player } from '../types/game';
import { parseVoiceScores, ParsedVoiceScore } from '../utils/voiceScoreParser';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PlayerAvatar } from './ui/PlayerAvatar';

interface VoiceScoreEntryButtonProps {
  players: Player[];
  roundIndex: number;
  avatarStyle?: AvatarStyle;
  onApplyScores: (scores: { playerId: string; score: number }[]) => void;
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | null {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export const VoiceScoreEntryButton: React.FC<VoiceScoreEntryButtonProps> = ({
  players,
  roundIndex,
  avatarStyle,
  onApplyScores,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<ParsedVoiceScore[] | null>(null);
  const [editedScores, setEditedScores] = useState<Record<string, string>>({});
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isSupported = typeof window !== 'undefined' && !!getSpeechRecognitionCtor();

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  if (!isSupported) return null;

  const startListening = () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    setError(null);
    const recognition = new Ctor();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length })
        .map((_, i) => event.results[i][0].transcript)
        .join(' ');

      const parsed = parseVoiceScores(transcript, players);
      if (parsed.length === 0) {
        setError(`Didn't catch any scores in "${transcript}". Try "Ryan 15, Amanda 10".`);
        return;
      }

      const initialEdits: Record<string, string> = {};
      players.forEach((p) => {
        const match = parsed.find((r) => r.playerId === p.id);
        initialEdits[p.id] = match ? String(match.score) : '';
      });
      setEditedScores(initialEdits);
      setReview(parsed);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === 'no-speech') {
        setError("Didn't hear anything — try again.");
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Microphone access was denied.');
      } else {
        setError('Voice entry failed — try again.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const closeReview = () => {
    setReview(null);
    setEditedScores({});
  };

  const applyReview = () => {
    const scores = Object.entries(editedScores)
      .filter(([, v]) => v.trim() !== '' && !Number.isNaN(parseInt(v, 10)))
      .map(([playerId, v]) => ({ playerId, score: parseInt(v, 10) }));
    onApplyScores(scores);
    closeReview();
  };

  return (
    <>
      <Button
        type="button"
        variant={isListening ? 'default' : 'outline'}
        size="icon"
        onClick={isListening ? stopListening : startListening}
        title="Enter scores by voice"
        className={`fixed z-20 bottom-10 bg-stone-950/70 hover:bg-stone-950/80 dark:bg-white/70 hover:dark:bg-white/80 dark:text-stone-900 text-white backdrop-blur right-4 rounded-full ${isListening ? 'animate-pulse ring-2 ring-offset-1 ring-blue-500 bg-blue-500 hover:bg-blue-500 text-white border-blue-500' : 'ring-0 border-0'}`}
      >
        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </Button>

      {error && !review && (
        <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
          <div className="bg-card border border-border shadow-xl rounded-xl px-4 py-3 max-w-sm text-sm text-foreground flex items-center gap-2">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-muted-foreground hover:text-foreground text-xs underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {review && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-primary shrink-0" />
              <h2 className="text-lg font-bold">Confirm scores</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Round {roundIndex + 1} — review before applying.
            </p>
            <div className="space-y-2 mb-6">
              {players.map((player, index) => (
                <div key={player.id} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: player.color }}
                  >
                    <PlayerAvatar player={player} index={index} avatarStyle={avatarStyle} />
                  </div>
                  <span className="flex-1 text-sm font-medium text-foreground truncate">
                    {player.name}
                  </span>
                  <Input
                    type="tel"
                    value={editedScores[player.id] ?? ''}
                    onChange={(e) => setEditedScores((prev) => ({ ...prev, [player.id]: e.target.value }))}
                    placeholder="-"
                    className="w-20 text-center"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeReview}>Cancel</Button>
              <Button onClick={applyReview}>Apply Scores</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
