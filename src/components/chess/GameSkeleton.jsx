// spec §41 — game screen must show board/player/clock/move-list skeletons, never a blank screen
function Pulse({ className = '', style = {} }) {
  return <div className={`animate-pulse-slow rounded-sm ${className}`} style={{ background: 'var(--surface-alt)', ...style }} />;
}

export default function GameSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-4 md:grid md:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Pulse className="h-8 w-32" />
          <Pulse className="h-8 w-16" />
        </div>
        <Pulse className="mx-auto aspect-square max-w-[560px] w-full rounded-md" />
        <div className="mt-2 flex items-center justify-between">
          <Pulse className="h-8 w-32" />
          <Pulse className="h-8 w-16" />
        </div>
      </div>
      <div className="mt-4 space-y-2 md:mt-0 md:pl-4">
        <Pulse className="h-8 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Pulse key={i} className="h-5 w-full" />
        ))}
      </div>
    </div>
  );
}
