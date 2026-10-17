import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Checkbox } from './ui/checkbox';

type SettingKey = 'email_friend_activity' | 'email_league_activity' | 'email_weekly_digest';
type Settings = Record<SettingKey, boolean>;

const DEFAULTS: Settings = {
  email_friend_activity: true,
  email_league_activity: true,
  email_weekly_digest: true,
};

const OPTIONS: { key: SettingKey; label: string; description: string }[] = [
  { key: 'email_friend_activity', label: 'Friend requests', description: 'When someone sends or accepts a friend request.' },
  { key: 'email_league_activity', label: 'League updates', description: "When you're added to a league, or a season starts or ends." },
  { key: 'email_weekly_digest', label: 'Weekly digest', description: "A Monday summary of your leagues' games and standings." },
];

// Which notification emails this person gets. No saved row means all on.
export const EmailNotificationSettings = ({ userId }: { userId: string }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('notification_settings')
      .select('email_friend_activity, email_league_activity, email_weekly_digest')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => setSettings({ ...DEFAULTS, ...(data ?? {}) }));
  }, [userId]);

  const toggle = async (key: SettingKey, value: boolean) => {
    if (!supabase || !settings) return;
    const previous = settings;
    const next = { ...settings, [key]: value };
    setSettings(next);
    setError('');
    const { error: saveError } = await supabase
      .from('notification_settings')
      .upsert({ user_id: userId, ...next, updated_at: new Date().toISOString() });
    if (saveError) {
      setSettings(previous);
      setError("Couldn't save that change. Please try again.");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">Email notifications</span>
      <div className="flex flex-col gap-3">
        {OPTIONS.map(option => (
          <label key={option.key} className="flex items-start gap-3 cursor-pointer w-fit">
            <Checkbox
              className="mt-0.5"
              checked={settings?.[option.key] ?? true}
              disabled={!settings}
              onCheckedChange={v => toggle(option.key, v === true)}
            />
            <span className="flex flex-col">
              <span className="text-sm text-foreground">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </span>
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};
