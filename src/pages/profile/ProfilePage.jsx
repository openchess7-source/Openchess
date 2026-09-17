import { useNavigate, useParams } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { mock } from '../../services/mockService';
import { useAuth } from '../../app/providers/AuthProvider';
import { useAsyncData } from '../../hooks/useAsyncData';
import { TitleBadge } from '../../components/common/Badge';
import Panel from '../../components/common/Panel';
import SectionTitle from '../../components/common/SectionTitle';
import GameHistoryCard from '../../components/games/GameHistoryCard';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

const RATING_HISTORY = [1180, 1205, 1190, 1240, 1260, 1230, 1284, 1270, 1310, 1284].map((v, i) => ({ i, v }));

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isMe = username === 'me';

  const playerState = useAsyncData(() => (isMe ? Promise.resolve(currentUser) : mock.findPlayer(username)), [username, isMe, currentUser]);
  const gamesState = useAsyncData(() => mock.recentGames(), []);

  if (playerState.status === 'loading' || gamesState.status === 'loading') return <LoadingState label="Loading profile" />;
  if (playerState.status === 'error') return <ErrorState message={playerState.error} onRetry={playerState.retry} />;
  if (gamesState.status === 'error') return <ErrorState message={gamesState.error} onRetry={gamesState.retry} />;

  const player = playerState.data;
  const games = gamesState.data;

  const primaryMode = player.ratings ? Object.entries(player.ratings).sort((a, b) => b[1] - a[1])[0] : ['rating', player.rating];

  return (
    <div className="pb-10">
      <div className="px-4 py-6 text-center">
        <div
          className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border font-display text-2xl font-bold"
          style={{ background: 'var(--surface-alt)', borderColor: 'var(--line)', color: 'var(--ink-soft)' }}
        >
          {(player.username || '').slice(0, 2).toUpperCase()}
        </div>
        <div className="flex items-center justify-center gap-1.5 font-display text-lg font-bold">
          <TitleBadge title={player.title} /> {player.username}
        </div>
        <div className="mt-1 text-sm" style={{ color: 'var(--ink-soft)' }}>
          ♟ {primaryMode[1].toLocaleString()} {primaryMode[0]}
        </div>
      </div>

      <div className="mx-auto flex max-w-md justify-center gap-8 px-4 pb-2">
        <Stat value={player.games ?? '—'} label="Games" />
        <Stat value={player.winRate ? `${Math.round(player.winRate * 100)}%` : '—'} label="Win rate" />
        <Stat value={player.peakRating ?? '—'} label="Best rating" />
      </div>

      <SectionTitle className="md:mx-auto md:max-w-2xl">Rating history</SectionTitle>
      <div className="mx-4 h-28 rounded-md border p-2 md:mx-auto md:max-w-2xl" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={RATING_HISTORY}>
            <YAxis hide domain={['dataMin - 20', 'dataMax + 20']} />
            <Line type="monotone" dataKey="v" stroke="var(--accent)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {player.ratings && (
        <>
          <SectionTitle className="md:mx-auto md:max-w-2xl">Ratings by mode</SectionTitle>
          <div className="px-4 md:mx-auto md:max-w-2xl md:px-0">
            <Panel>
              {Object.entries(player.ratings).map(([mode, rating]) => (
                <div key={mode} className="flex items-center justify-between border-b px-4 py-3 last:border-b-0 capitalize" style={{ borderColor: 'var(--line)' }}>
                  <span className="text-sm font-semibold">{mode}</span>
                  <span className="font-display text-base font-bold">{rating}</span>
                </div>
              ))}
            </Panel>
          </div>
        </>
      )}

      <SectionTitle className="md:mx-auto md:max-w-2xl">Recent games</SectionTitle>
      <div className="px-4 md:mx-auto md:max-w-2xl md:px-0">
        <Panel>
          {games.map((g) => (
            <GameHistoryCard key={g.id} game={g} onClick={() => navigate(`/analysis/${g.id}`)} />
          ))}
        </Panel>
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="text-center">
      <div className="font-display text-lg font-bold">{value}</div>
      <div className="text-[11px]" style={{ color: 'var(--ink-soft)' }}>{label}</div>
    </div>
  );
}
