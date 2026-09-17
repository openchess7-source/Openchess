import { useState } from 'react';
import { ChevronIcon } from '../navigation/icons';

// Reusable collapsible desktop panel (spec §72) — moves, chat, engine, standings.
// `title` may be plain text or interactive content (e.g. a tab row); it is
// rendered next to, not inside, the collapse toggle so nested controls stay clickable.
export default function SidePanel({ title, children, defaultCollapsed = false }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  return (
    <div className="hidden shrink-0 border-l md:block" style={{ width: collapsed ? 44 : 320, transition: 'width .18s ease', borderColor: 'var(--line)' }}>
      <div className="flex items-center border-b" style={{ borderColor: 'var(--line)' }}>
        {!collapsed && <div className="min-w-0 flex-1">{title}</div>}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex h-9 w-9 shrink-0 items-center justify-center"
          style={{ color: 'var(--ink-soft)' }}
          aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
        >
          <ChevronIcon width={14} height={14} style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }} />
        </button>
      </div>
      {!collapsed && children}
    </div>
  );
}
