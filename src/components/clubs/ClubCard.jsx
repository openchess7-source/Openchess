import Button from '../common/Button';

export default function ClubCard({ club, onOpen, onJoin }) {
  return (
    <div onClick={onOpen} className="flex cursor-pointer items-center justify-between border-b px-4 py-3.5 last:border-b-0" style={{ borderColor: 'var(--line)' }}>
      <div className="min-w-0">
        <div className="truncate text-[14px] font-semibold">♞ {club.name}</div>
        <div className="text-xs" style={{ color: 'var(--ink-soft)' }}>
          {club.members.toLocaleString()} members · {club.online} online
        </div>
      </div>
      {!club.joined && (
        <Button
          variant="secondary"
          className="!px-3.5 !py-1.5 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onJoin?.();
          }}
        >
          Join
        </Button>
      )}
    </div>
  );
}
