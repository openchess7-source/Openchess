import { mock } from '../../services/mockService';
import { useAsyncData } from '../../hooks/useAsyncData';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

export default function AchievementsPage() {
  const achievementsState = useAsyncData(() => mock.achievements(), []);

  if (achievementsState.status === 'loading') return <LoadingState label="Loading achievements" />;
  if (achievementsState.status === 'error') return <ErrorState message={achievementsState.error} onRetry={achievementsState.retry} />;

  const achievements = achievementsState.data;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-10 pt-4">
      <h1 className="mb-1 font-display text-lg font-bold">Achievements</h1>
      <p className="mb-5 text-sm" style={{ color: 'var(--ink-soft)' }}>{unlockedCount} of {achievements.length} unlocked</p>
      <div className="grid grid-cols-3 gap-2.5">
        {achievements.map((a) => (
          <div
            key={a.id}
            className="rounded-md border p-4 text-center transition-transform"
            style={{ borderColor: 'var(--line)', background: 'var(--surface)', opacity: a.unlocked ? 1 : 0.4 }}
          >
            <div className="mb-1.5 text-2xl">{a.icon}</div>
            <div className="text-[11px] font-bold">{a.label}</div>
            <div className="mt-0.5 text-[10px]" style={{ color: 'var(--ink-soft)' }}>{a.rarity}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
