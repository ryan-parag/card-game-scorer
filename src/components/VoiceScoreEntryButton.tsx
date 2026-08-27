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

  const startListening = async () => {
    if (isListening || recognitionRef.current) return;

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    setError(null);
    setIsListening(true);

    // Some mobile browsers (notably iOS Safari and Android Chrome in embedded
    // webviews) don't reliably resolve the mic permission when it's requested
    // implicitly by SpeechRecognition.start() — the OS prompt appears, the user
    // allows it, and recognition still fails with "not-allowed". Explicitly
    // requesting getUserMedia first reliably triggers and persists the
    // permission grant, and lets us report the real reason it failed.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setError('Microphone access was denied. Check your browser or system settings and try again.');
      } else if (name === 'NotFoundError') {
        setError('No microphone was found on this device.');
      } else {
        setError('Could not access the microphone — try again.');
      }
      setIsListening(false);
      return;
    }

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
      recognitionRef.current = null;
      setIsListening(false);
      if (event.error === 'no-speech') {
        setError("Didn't hear anything — try again.");
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Microphone access was denied. Check your browser or system settings and try again.');
      } else if (event.error === 'audio-capture') {
        setError('No microphone was found on this device.');
      } else if (event.error === 'network') {
        setError('Voice entry needs an internet connection — try again.');
      } else if (event.error === 'aborted') {
        // User-initiated stop; not an error worth surfacing.
      } else {
        setError('Voice entry failed — try again.');
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
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
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        title="Enter scores by voice"
        className={`transition p-4 flex items-center justify-center fixed-button-inner col-span-1 !rounded-none border-l border-white/10 dark:border-black/10 ${isListening ? 'text-blue-300 dark:text-blue-600 !bg-blue-500/20' : ''}`}
      >
        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        {isListening && <span className="ml-1 h-2 w-2 rounded-full bg-blue-500 animate-pulse ring-1 ring-offset-1 ring-blue-500"/>}
      </button>

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
