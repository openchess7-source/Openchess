// The one piece of real decision-making in crash recovery, pulled out so
// it can be tested without chess.js/socket.io installed (same reasoning
// as services/bracket.js and services/swiss.js): given a game row as it
// was last persisted, what should its in-memory clock state be right
// after a restart?
//
// Deliberate choice: PAUSE both clocks across the outage rather than
// bleeding real wall-clock time. turnStartedAt becomes "now" and the
// last-persisted remaining_ms is used exactly as stored — a player
// should never lose on time because the server, not them, was down.
export function computeRehydratedClockState(game, now = Date.now()) {
  return {
    remaining: { white: game.white_remaining_ms, black: game.black_remaining_ms },
    incrementMs: game.increment * 1000,
    turnStartedAt: now,
  };
}
