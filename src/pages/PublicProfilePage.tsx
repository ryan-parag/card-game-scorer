import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CircleUserRound, UserCheck, UserPlus, Clock, Trophy, Medal } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Profile } from '../hooks/useFriends';
import { useFriends } from '../hooks/useFriends';
import { getSettings, saveSettings } from '../utils/storage';
import Topbar from '../components/ui/Topbar';
import { Button } from '../components/ui/button';
import moment from 'moment';

export const PublicProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [friendCount, setFriendCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  useEffect(() => {
    const settings = getSettings();
    const dark = settings.theme === 'dark';
    setIsDark(dark);
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    supabase?.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id));
  }, []);

  useEffect(() => {
    if (!userId || !supabase) return;

    const fetchProfile = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, avatar_url, display_name, created_at')
        .eq('id', userId)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(data);

      // Count accepted friends
      const { count } = await supabase
        .from('friendships')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

      setFriendCount(count ?? 0);
      setLoading(false);
    };

    fetchProfile();
  }, [userId]);

  useEffect(() => {
    if (!userId || !supabase) return;

    const fetchGameStats = async () => {
      // Find seasons the user participated in
      const { data: userGames } = await supabase
        .from('games')
        .select('season_id')
        .eq('status', 'completed')
        .filter('players', 'cs', `[{"id":"${userId}"}]`)
        .not('season_id', 'is', null);

      const seasonIds = [...new Set((userGames ?? []).map((g: { season_id: string }) => g.season_id))];
      if (seasonIds.length === 0) return;

      // Fetch all completed games for those seasons + season records in parallel
      const [{ data: allSeasonGames }, { data: seasons }] = await Promise.all([
        supabase
          .from('games')
          .select('players, ranking, season_id')
          .eq('status', 'completed')
          .in('season_id', seasonIds),
        supabase
          .from('league_seasons')
          .select('id, scoring_system_id')
          .in('id', seasonIds),
      ]);

      // Fetch scoring rules for any seasons that have a scoring system
      const scoringSystemIds = [...new Set(
        (seasons ?? [])
          .map((s: { scoring_system_id: string | null }) => s.scoring_system_id)
          .filter(Boolean) as string[]
      )];
      const { data: rules } = scoringSystemIds.length > 0
        ? await supabase
            .from('scoring_system_rules')
            .select('scoring_system_id, rank, points')
            .in('scoring_system_id', scoringSystemIds)
        : { data: [] };

      const seasonScoringMap = Object.fromEntries(
        (seasons ?? []).map((s: { id: string; scoring_system_id: string | null }) => [s.id, s.scoring_system_id])
      );

      const rulesMap: Record<string, Array<{ rank: number; points: number }>> = {};
      for (const rule of rules ?? []) {
        const r = rule as { scoring_system_id: string; rank: number; points: number };
        if (!rulesMap[r.scoring_system_id]) rulesMap[r.scoring_system_id] = [];
        rulesMap[r.scoring_system_id].push({ rank: r.rank, points: r.points });
      }

      let seasonWins = 0;
      let podiums = 0;

      for (const seasonId of seasonIds) {
        const seasonGames = (allSeasonGames ?? []).filter((g: { season_id: string }) => g.season_id === seasonId);
        const scoringSystemId = seasonScoringMap[seasonId];
        const scoringRules = scoringSystemId ? (rulesMap[scoringSystemId] ?? []) : [];

        const scoreMap: Record<string, { rawPts: number; champPts: number }> = {};

        for (const game of seasonGames) {
          const players = game.players as Array<{ id: string; totalScore: number }>;
          const sorted = [...players].sort((a, b) =>
            game.ranking === 'low-wins'
              ? (a.totalScore ?? 0) - (b.totalScore ?? 0)
              : (b.totalScore ?? 0) - (a.totalScore ?? 0)
          );
          const gameRank = sorted.findIndex(p => p.id === userId);
          if (gameRank >= 0 && gameRank < 3) podiums++;
          sorted.forEach((player, posIndex) => {
            if (!player.id) return;
            if (!scoreMap[player.id]) scoreMap[player.id] = { rawPts: 0, champPts: 0 };
            scoreMap[player.id].rawPts += player.totalScore ?? 0;
            scoreMap[player.id].champPts += scoringRules.find(r => r.rank === posIndex + 1)?.points ?? 0;
          });
        }

        const ranked = Object.entries(scoreMap).sort(([, a], [, b]) =>
          (b.champPts + b.rawPts) - (a.champPts + a.rawPts)
        );
        const userRank = ranked.findIndex(([id]) => id === userId);
        if (userRank === 0) seasonWins++;
      }

      setGameStats({ seasonWins, podiums });
    };

    fetchGameStats();
  }, [userId]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    saveSettings({ theme: next ? 'dark' : 'light' });
  };

  // Use useFriends to know the relationship with this profile
  const { friends, pendingSent, sendRequest } = useFriends(currentUserId);
  const isOwnProfile = currentUserId === userId;
  const isFriend = friends.some(f => f.profile.id === userId);
  const isPendingSent = pendingSent.some(f => f.profile.id === userId);

  const [gameStats, setGameStats] = useState({ seasonWins: 0, podiums: 0 });
  const [addStatus, setAddStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');

  const handleAddFriend = async () => {
    if (!profile?.email) return;
    setAddStatus('loading');
    const error = await sendRequest(profile.email);
    setAddStatus(error ? 'error' : 'sent');
  };

  if (loading) {
    return (
      <div className="relative min-h-screen w-full">
        <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate(-1)} />
        <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="relative min-h-screen w-full">
        <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate(-1)} />
        <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground mb-2">Profile not found</h1>
            <p className="text-sm text-muted-foreground">This user doesn't exist or their profile is unavailable.</p>
          </div>
        </div>
      </div>
    );
  }

  const displayName = profile.display_name || profile.email.split('@')[0];

  return (
    <div className="relative min-h-screen w-full">
      <Topbar toggleTheme={toggleTheme} isDark={isDark} onBack={() => navigate(-1)} />
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary pt-12 lg:pt-16 px-4 pb-32">
        <div className="w-full max-w-lg mx-auto mt-16">
          <motion.div
            className="w-full bg-card rounded-2xl shadow-xl p-6 lg:p-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Avatar + name */}
            <div className="flex flex-col items-center text-center gap-3 mb-8">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                  : <CircleUserRound className="w-full h-full p-3 text-muted-foreground" />
                }
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                <div className="flex items-center justify-center gap-1 mt-1 text-muted-foreground text-sm">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Joined {moment((profile as any).created_at).format('MMMM YYYY')}</span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                  <p className="text-2xl font-bold text-foreground">{gameStats.seasonWins}</p>
                </div>
                <p className="text-xs text-muted-foreground">Season Wins</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Medal className="w-3.5 h-3.5 text-amber-500" />
                  <p className="text-2xl font-bold text-foreground">{gameStats.podiums}</p>
                </div>
                <p className="text-xs text-muted-foreground">Podiums</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground mb-0.5">{friendCount}</p>
                <p className="text-xs text-muted-foreground">Friends</p>
              </div>
            </div>

            {/* Action button */}
            {!isOwnProfile && currentUserId && (
              <div className="flex justify-center">
                {isFriend ? (
                  <Button variant="secondary" size="sm" disabled className="gap-2">
                    <UserCheck className="w-4 h-4" />
                    Friends
                  </Button>
                ) : isPendingSent || addStatus === 'sent' ? (
                  <Button variant="outline" size="sm" disabled className="gap-2">
                    <Clock className="w-4 h-4" />
                    Request sent
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={addStatus === 'loading'}
                    onClick={handleAddFriend}
                    className="gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    {addStatus === 'loading' ? 'Sending…' : 'Add Friend'}
                  </Button>
                )}
              </div>
            )}

            {isOwnProfile && (
              <div className="flex justify-center">
                <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
                  Edit profile
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
