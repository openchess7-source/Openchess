// One of the few pages where marketing-style design is acceptable (spec §PAGE 44).
export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-10 text-center">
      <div className="mb-3 text-4xl" style={{ color: 'var(--accent)' }}>♞</div>
      <h1 className="mb-3 font-display text-3xl font-bold">Openchess</h1>
      <p className="mx-auto mb-10 max-w-md text-base" style={{ color: 'var(--ink-soft)' }}>
        Built for people who open a chess app every day — not once in a while. Play, solve, study, and compete,
        without ever feeling like you left the game to read a website.
      </p>

      <div className="mb-10 grid gap-4 text-left md:grid-cols-3">
        {[
          { title: 'Board-first', body: 'Every screen is built around the chessboard, not around marketing copy.' },
          { title: 'One product loop', body: 'Discover, play, review, and improve — the same loop, every session.' },
          { title: 'Fast to play', body: 'From opening the app to making your first move in seconds, not minutes.' },
        ].map((f) => (
          <div key={f.title} className="rounded-md border p-4" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
            <div className="mb-1 font-display text-base font-bold">{f.title}</div>
            <div className="text-sm" style={{ color: 'var(--ink-soft)' }}>{f.body}</div>
          </div>
        ))}
      </div>

      <div className="mb-10 text-left">
        <div className="mb-2 font-display text-lg font-bold">Roadmap</div>
        <ul className="space-y-1.5 text-sm" style={{ color: 'var(--ink-soft)' }}>
          <li>· Real-time Bughouse and Fog of War backed by a live variant engine</li>
          <li>· Full Stockfish WASM analysis in the browser</li>
          <li>· Club tournaments with automated Swiss pairing</li>
        </ul>
      </div>

      <div className="text-sm" style={{ color: 'var(--ink-soft)' }}>
        Questions? Reach us at <a href="mailto:hello@openchess.example" style={{ color: 'var(--accent)' }}>hello@openchess.example</a>
      </div>
    </div>
  );
}
