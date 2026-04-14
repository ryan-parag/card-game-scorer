import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Plus, Pencil, Trash2, Loader, ChevronDown, ChevronUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { getSettings, saveSettings } from '../utils/storage';
import Topbar from '../components/ui/Topbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useScoringSystem, ScoringSystem } from '../hooks/useScoringSystem';
import BlurBg from '../components/ui/BlurBg';

// ── Rule editor ───────────────────────────────────────────────────────────────

interface DraftRule { rank: number; points: string }

function RuleEditor({
  rules,
  onChange,
}: {
  rules: DraftRule[];
  onChange: (rules: DraftRule[]) => void;
}) {
  const addRule = () =>
    onChange([...rules, { rank: rules.length + 1, points: '' }]);

  const removeRule = (i: number) =>
    onChange(rules.filter((_, idx) => idx !== i).map((r, idx) => ({ ...r, rank: idx + 1 })));

  const setPoints = (i: number, value: string) =>
    onChange(rules.map((r, idx) => idx === i ? { ...r, points: value } : r));

  const ordinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {rules.length > 0 && (
        <div className="grid grid-cols-[1fr_80px_32px] gap-2 px-1 pb-0.5">
          <span className="text-xs text-stone-400 dark:text-stone-500">Finish</span>
          <span className="text-xs text-stone-400 dark:text-stone-500 text-right">Points</span>
          <div />
        </div>
      )}
      {rules.map((rule, i) => (
        <div key={i} className="grid grid-cols-[1fr_80px_32px] items-center gap-2">
          <span className="text-sm text-stone-700 dark:text-stone-300 pl-1">{ordinal(rule.rank)} place</span>
          <Input
            type="number"
            min={0}
            value={rule.points}
            onChange={e => setPoints(i, e.target.value)}
            placeholder="0"
            className="!px-2 !py-1 !text-sm text-right"
          />
          <button
            type="button"
            onClick={() => removeRule(i)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={addRule} className="gap-1.5 w-fit mt-1">
        <Plus className="w-3.5 h-3.5" />
        Add rank
      </Button>
    </div>
  );
}

// ── System card ───────────────────────────────────────────────────────────────

function SystemCard({
  system,
  isOwner,
  currentUserId,
  onUpdate,
  onDelete,
}: {
  system: ScoringSystem;
  isOwner: boolean;
  currentUserId: string | undefined;
  onUpdate: (updates: { name?: string; description?: string | null; rules?: { rank: number; points: number }[] }) => Promise<string | null>;
  onDelete: () => Promise<string | null>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(system.name);
  const [editDesc, setEditDesc] = useState(system.description ?? '');
  const [editRules, setEditRules] = useState<DraftRule[]>(
    system.rules.map(r => ({ rank: r.rank, points: String(r.points) }))
  );
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const startEdit = () => {
    setEditName(system.name);
    setEditDesc(system.description ?? '');
    setEditRules(system.rules.map(r => ({ rank: r.rank, points: String(r.points) })));
    setEditError('');
    setEditing(true);
    setExpanded(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setSaving(true);
    setEditError('');
    const rules = editRules
      .filter(r => r.points !== '')
      .map(r => ({ rank: r.rank, points: parseInt(r.points, 10) }));
    const err = await onUpdate({ name: editName, description: editDesc || null, rules });
    setSaving(false);
    if (err) { setEditError(err); return; }
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${system.name}"? Any seasons using this system will lose their scoring.`)) return;
    setDeleting(true);
    await onDelete();
  };

  const previewRules = system.rules.slice(0, 5);

  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => { setExpanded(v => !v); if (editing) setEditing(false); }}
          className="flex-1 flex items-start gap-3 text-left min-w-0"
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium text-stone-900 dark:text-white text-sm">{system.name}</p>
            {system.description && (
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">{system.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {previewRules.map(r => (
                <span key={r.rank} className="text-xs bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded px-1.5 py-0.5">
                  {['1st','2nd','3rd','4th','5th'][r.rank - 1] ?? `${r.rank}th`}: {r.points}
                </span>
              ))}
              {system.rules.length > 5 && (
                <span className="text-xs text-stone-400 dark:text-stone-500">+{system.rules.length - 5} more</span>
              )}
              {system.rules.length === 0 && (
                <span className="text-xs text-stone-400 dark:text-stone-500 italic">No rules defined</span>
              )}
              <span className="shrink-0 text-stone-400 dark:text-stone-500 mt-0.5">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </span>
            </div>
          </div>
        </button>
        {isOwner && (
          <div className="flex items-center gap-1 shrink-0">
            <Button size="sm" variant="outline" onClick={startEdit} className="h-7 w-7 p-0 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200">
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
              className="h-7 w-7 p-0 text-stone-400 hover:text-red-500"
            >
              {deleting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </Button>
          </div>
        )}
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="border-t border-stone-200 dark:border-stone-700 px-4 py-3">
              {editing ? (
                <form onSubmit={handleSave} className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs text-stone-500 dark:text-stone-400 mb-1 block">Name</label>
                    <Input value={editName} onChange={e => setEditName(e.target.value)} required className="!px-3 !py-2 !text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 dark:text-stone-400 mb-1 block">Description (optional)</label>
                    <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} className="!px-3 !py-2 !text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500 dark:text-stone-400 mb-2 block">Points per finish</label>
                    <RuleEditor rules={editRules} onChange={setEditRules} />
                  </div>
                  {editError && <p className="text-xs text-red-500">{editError}</p>}
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" variant="secondary" disabled={saving}>
                      {saving ? 'Saving…' : 'Save'}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left text-xs text-stone-500 dark:text-stone-400 pb-1.5 font-medium">Finish</th>
                      <th className="text-right text-xs text-stone-500 dark:text-stone-400 pb-1.5 font-medium">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {system.rules.map(r => {
                      const ordinals = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th'];
                      return (
                        <tr key={r.rank} className="border-t border-stone-100 dark:border-stone-700/50">
                          <td className="py-1.5 text-stone-700 dark:text-stone-300">
                            {ordinals[r.rank - 1] ?? `${r.rank}th`} place
                          </td>
                          <td className="py-1.5 text-right font-semibold tabular-nums text-stone-900 dark:text-white">
                            {r.points}
                          </td>
                        </tr>
                      );
                    })}
                    {system.rules.length === 0 && (
                      <tr>
                        <td colSpan={2} className="py-2 text-stone-400 dark:text-stone-600 italic text-xs">
                          No rules — all finishes score 0
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export const ScoringSystemPage = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newRules, setNewRules] = useState<DraftRule[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    const settings = getSettings();
    const dark = settings.theme === 'dark';
    setIsDark(dark);
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    supabase?.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id));
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    saveSettings({ theme: next ? 'dark' : 'light' });
  };

  const { systems, loading, createSystem, updateSystem, deleteSystem, isOwner } =
    useScoringSystem(currentUserId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError('');
    const rules = newRules
      .filter(r => r.points !== '')
      .map(r => ({ rank: r.rank, points: parseInt(r.points, 10) }));
    const err = await createSystem(newName, newDesc || null, rules);
    setCreating(false);
    if (err) { setCreateError(err); return; }
    setNewName(''); setNewDesc(''); setNewRules([]); setShowCreate(false);
  };

  return (
    <div className="relative min-h-screen w-full">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate('/')} />
      <div className="min-h-screen bg-gradient-to-br from-white to-stone-200 dark:from-stone-950 dark:to-stone-900 pt-12 lg:pt-16 px-4 pb-32">
        <div className="w-full max-w-4xl mx-auto mt-16 flex flex-col items-center">

          {/* Header card */}
          <motion.div
            className="w-full max-w-sm flex flex-col text-center items-center gap-3 mb-8 shadow-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/50 backdrop-blur-xl p-5 rounded-xl relative transform z-0 overflow-hidden"
            initial={{ opacity: 0, y: '80px', rotate: 0 }}
            animate={{ opacity: 1, y: '48px', rotate: 2 }}
            exit={{ opacity: 0, y: '80px', rotate: 0 }}
            transition={{ duration: 0.24, delay: 0.4, type: 'spring', stiffness: 150 }}
          >
            <BlurBg/>
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-b from-violet-400 to-violet-700 shadow-2xl shadow-violet-500/50 border border-violet-500 dark:border-violet-800 text-white">
              <ClipboardCheck className="h-10 w-10" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-stone-950 dark:text-white mb-1">
                Scoring Systems
              </h1>
              <p className="text-stone-600 dark:text-stone-400 text-sm md:text-base">
                Define championship point tables
              </p>
            </div>
          </motion.div>

          {/* Main card */}
          <motion.div
            className="w-full relative z-10 bg-white dark:bg-stone-900 rounded-2xl shadow-xl px-4 pt-4 pb-4 overflow-hidden border border-black/5 dark:border-white/5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => { setShowCreate(v => !v); setCreateError(''); }}
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" />
                New system
              </Button>
            </div>

            {/* Create form */}
            <AnimatePresence>
              {showCreate && (
                <motion.form
                  onSubmit={handleCreate}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden mb-6"
                >
                  <div className="flex flex-col gap-3 p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
                    <Input
                      placeholder="System name (e.g. F1 Points)"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      required
                      autoFocus
                      className="!px-3 !py-2 !text-sm"
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      className="!px-3 !py-2 !text-sm"
                    />
                    <div>
                      <label className="text-xs text-stone-500 dark:text-stone-400 mb-2 block">
                        Points per finish position
                      </label>
                      <RuleEditor rules={newRules} onChange={setNewRules} />
                    </div>
                    {createError && <p className="text-xs text-red-500">{createError}</p>}
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" variant="secondary" disabled={creating || !newName.trim()}>
                        {creating ? 'Creating…' : 'Create system'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => { setShowCreate(false); setNewName(''); setNewDesc(''); setNewRules([]); setCreateError(''); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* List */}
            {loading ? (
              <div className="flex items-center gap-2 text-stone-400 py-8 justify-center">
                <Loader className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading…</span>
              </div>
            ) : systems.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-stone-400 dark:text-stone-600">
                <ClipboardCheck className="w-8 h-8" />
                <p className="text-sm">No scoring systems yet — create one above</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {systems.map(system => (
                  <SystemCard
                    key={system.id}
                    system={system}
                    isOwner={isOwner(system)}
                    currentUserId={currentUserId}
                    onUpdate={updates => updateSystem(system.id, updates)}
                    onDelete={() => deleteSystem(system.id)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
