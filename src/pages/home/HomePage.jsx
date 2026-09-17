import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { useTimeControl } from '../../hooks/useTimeControl';
import { mock } from '../../services/mockService';
import { useAsyncData } from '../../hooks/useAsyncData';
import Panel from '../../components/common/Panel';
import SectionTitle from '../../components/common/SectionTitle';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import GameHistoryCard from '../../components/games/GameHistoryCard';
import QuickAction from '../../components/common/QuickAction';

function GuestHome() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center md:py-24">
      <div className="mb-3 text-4xl" style={{ color: 'var(--accent)' }}>♞</div>
      <h1 className="font-display text-3xl font-bold md:text-4xl">Openchess</h1>
      <p className="mx-auto mt-3 max-w-md" style={{ color: 'var(--ink-soft)' }}>
        Play, solve puzzles, study openings, and climb the ratings — all in one app.
      </p>
      <div className="mt-7 flex justify-center gap-3">
        <Button onClick={() => navigate('/register')}>Create account</Button>
        <Button variant="secondary" onClick={() => navigate('/login')}>Log in</Button>
      </div>
    </div>
  );
}

async function loadHomeData() {
  // allSettled so one failing resource (say, tournaments) doesn't blank the
  // entire dashboard — each section degrades to empty rather than the page
  // erroring out wholesale.
  const [activeGames, dailyPuzzle, recentGames, friends, tournaments, streak] = await Promise.allSettled([
    mock.activeGames(),
    mock.dailyPuzzle(),
    mock.recentGames(),
    mock.friends(),
    mock.tournaments(),
    mock.puzzleStreak(),
  ]);
  const value = (r, fallback) => (r.status === 'fulfilled' ? r.value : fallback);
  return {
    activeGames: value(activeGames, []),
    dailyPuzzle: value(dailyPuzzle, null),
    recentGames: value(recentGames, []),
    friends: value(friends, []),
    tournaments: value(tournaments, []),
    streak: value(streak, { streak: 0 }).streak,
  };
}

export default function HomePage() {
  const { status, user } = useAuth();
  const navigate = useNavigate();
  const [lastTC] = useTimeControl();
  const homeState = useAsyncData(loadHomeData, [status]);

  if (status === 'loading') return <LoadingState label="Loading Openchess" />;
  if (status === 'guest') return <GuestHome />;
  if (homeState.status === 'loading') return <LoadingState label="Loading your dashboard" />;
  if (homeState.status === 'error') return <ErrorState message={homeState.error} onRetry={homeState.retry} />;

  const data = homeState.data;
  const ratingEntries = Object.entries(user.ratings || {}).slice(0, 3);

  return (
    <div className="pb-8">
      <div className="grid gap-4 px-4 pt-4 md:mx-auto md:max-w-4xl md:grid-cols-[1.1fr_1fr] md:px-0">
        <div>
          <QuickAction
            eyebrow="Quick play"
            title={`${lastTC.category[0].toUpperCase() + lastTC.category.slice(1)} · ${lastTC.label}`}
            actionLabel="Play"
            onAction={() => navigate('/play/quick')}
          />
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <button onClick={() => navigate('/play/custom')} className="rounded-full border px-2.5 py-1.5 text-xs font-semibold" style={{ borderColor: 'var(--line)', color: 'var(--ink-soft)' }}>
              Custom game
            </button>
            <button onClick={() => navigate('/play/bots')} className="rounded-full border px-2.5 py-1.5 text-xs font-semibold" style={{ borderColor: 'var(--line)', color: 'var(--ink-soft)' }}>
              Play a bot
            </button>
            <button onClick={() => navigate('/friends')} className="rounded-full border px-2.5 py-1.5 text-xs font-semibold" style={{ borderColor: 'var(--line)', color: 'var(--ink-soft)' }}>
              Play a friend
            </button>
          </div>
        </div>

        <Panel>
          <SectionTitle>Your ratings</SectionTitle>
          {ratingEntries.map(([mode, rating]) => (
            <div key={mode} className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: 'var(--line)' }}>
              <span className="text-sm font-semibold capitalize">{mode}</span>
              <span className="font-display text-lg font-bold">{rating.toLocaleString()}</span>
            </div>
          ))}
        </Panel>
      </div>

      {data.activeGames.length > 0 && (
        <>
          <SectionTitle className="mt-5 md:mx-auto md:max-w-4xl">Continue playing</SectionTitle>
          <div className="px-4 md:mx-auto md:max-w-4xl md:px-0">
            <QuickAction
              accent={false}
              eyebrow="Your turn"
              title={`vs ${data.activeGames[0].opponent} · ${data.activeGames[0].opponentRating}`}
              subtitle={
                data.activeGames[0].timeRemaining
                  ? `${data.activeGames[0].mode} ${data.activeGames[0].timeControl} · ${data.activeGames[0].timeRemaining} remaining`
                  : `${data.activeGames[0].mode} ${data.activeGames[0].timeControl}`
              }
              actionLabel="Continue"
              onAction={() => navigate(`/game/${data.activeGames[0].id}`)}
            />
          </div>
        </>
      )}

      {data.dailyPuzzle && (
        <>
          <SectionTitle className="mt-5 md:mx-auto md:max-w-4xl">Daily puzzle</SectionTitle>
          <div className="px-4 md:mx-auto md:max-w-4xl md:px-0">
            <QuickAction
              accent={false}
              eyebrow="Daily puzzle"
              title={`${data.dailyPuzzle.rating} rating`}
              subtitle={`🔥 ${data.streak} day streak`}
              actionLabel="Solve"
              onAction={() => navigate(`/puzzles/${data.dailyPuzzle._id || data.dailyPuzzle.id}`)}
            />
          </div>
        </>
      )}

      <SectionTitle className="mt-5 md:mx-auto md:max-w-4xl">Recent games</SectionTitle>
      <div className="px-4 md:mx-auto md:max-w-4xl md:px-0">
        <Panel>
          {data.recentGames.map((g) => (
            <GameHistoryCard key={g.id} game={g} onClick={() => navigate(`/analysis/${g.id}`)} />
          ))}
        </Panel>
      </div>

      <div className="grid gap-4 px-4 pt-5 md:mx-auto md:max-w-4xl md:grid-cols-2 md:px-0">
        <div>
          <SectionTitle className="!px-0">Friends online</SectionTitle>
          <Panel>
            {data.friends.filter((f) => f.online).length === 0 ? (
              <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--ink-faint)' }}>No friends online right now</div>
            ) : (
              data.friends
                .filter((f) => f.online)
                .map((f) => (
                  <div key={f.id} className="flex items-center justify-between border-b px-4 py-2.5 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--win)' }} />
                      <span className="text-sm font-semibold">{f.name}</span>
                    </div>
                    <button onClick={() => navigate(`/challenge/${f.name}`)} className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                      Challenge
                    </button>
                  </div>
                ))
            )}
          </Panel>
        </div>

        <div>
          <SectionTitle className="!px-0">Upcoming tournament</SectionTitle>
          {data.tournaments.filter((t) => t.status === 'upcoming')[0] ? (
            <Panel className="flex items-center justify-between p-4">
              <div>
                <div className="text-sm font-semibold">{data.tournaments.filter((t) => t.status === 'upcoming')[0].name}</div>
                <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>{data.tournaments.filter((t) => t.status === 'upcoming')[0].timeControl}</div>
              </div>
              <Button className="!px-3.5 !py-1.5 text-xs" onClick={() => navigate('/tournaments')}>View</Button>
            </Panel>
          ) : (
            <Panel><div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--ink-faint)' }}>Nothing scheduled — check Tournaments</div></Panel>
          )}
        </div>
      </div>
    </div>
  );
}
