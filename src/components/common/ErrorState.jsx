import Button from './Button';

// Real error UX (spec §71, §81) — used wherever a real API call failed.
export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="text-3xl" style={{ color: 'var(--loss)' }}>⚠</div>
      <div className="font-display text-base font-bold">Couldn't load this</div>
      <p className="max-w-xs text-sm" style={{ color: 'var(--ink-soft)' }}>{message}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
    </div>
  );
}
