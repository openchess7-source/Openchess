import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetDb, makeUsers } from './helpers.js';
import { upsertTournament, getTournamentById, serializeTournament } from '../src/db/tournaments.js';
import { insertMatch, setMatchWinner } from '../src/db/brackets.js';

beforeEach(resetDb);

function tournamentIn(msFromNow, formatType) {
  const id = upsertTournament({
    name: `T-${Math.random()}`,
    format: formatType === 'elimination' ? 'Single elimination' : 'Arena',
    formatType,
    mode: 'bullet',
    initial: 60,
    increment: 0,
    startsAt: new Date(Date.now() + msFromNow).toISOString(),
  });
  return getTournamentById(id);
}

describe('serializeTournament — arena format (unchanged time-based behavior)', () => {
  test('upcoming before starts_at', () => {
    const t = tournamentIn(60_000, 'arena');
    assert.equal(serializeTournament(t, null, 0).status, 'upcoming');
  });
  test('live just after starts_at', () => {
    const t = tournamentIn(-60_000, 'arena');
    assert.equal(serializeTournament(t, null, 0).status, 'live');
  });
  test('completed 2+ hours after starts_at', () => {
    const t = tournamentIn(-(2 * 60 * 60 * 1000 + 1000), 'arena');
    assert.equal(serializeTournament(t, null, 0).status, 'completed');
  });
});

describe('serializeTournament — elimination format (bracket-driven, not clock-driven)', () => {
  test('upcoming before starts_at, same as arena', () => {
    const t = tournamentIn(60_000, 'elimination');
    assert.equal(serializeTournament(t, null, 0).status, 'upcoming');
  });

  test('stays live long after starts_at if the bracket has no matches yet (not generated)', () => {
    const t = tournamentIn(-(3 * 60 * 60 * 1000), 'elimination'); // 3 hours ago — would be "completed" for arena
    const s = serializeTournament(t, null, 0);
    assert.equal(s.status, 'live');
    assert.equal(s.bracketStarted, false);
  });

  test('stays live while the bracket exists but the final is undecided', () => {
    const t = tournamentIn(-(3 * 60 * 60 * 1000), 'elimination');
    const [a, b] = makeUsers(2);
    insertMatch(t.id, 1, 0, a, b, 'pending'); // final match, not yet decided
    const s = serializeTournament(t, null, 0);
    assert.equal(s.status, 'live');
    assert.equal(s.bracketStarted, true);
    assert.equal(s.winnerId, undefined);
  });

  test('flips to completed once the final match has a winner, and reports winnerId', () => {
    const t = tournamentIn(-(3 * 60 * 60 * 1000), 'elimination');
    const [a, b] = makeUsers(2);
    const matchId = insertMatch(t.id, 1, 0, a, b, 'pending');
    setMatchWinner(matchId, a);
    const s = serializeTournament(t, null, 0);
    assert.equal(s.status, 'completed');
    assert.equal(s.winnerId, String(a));
  });

  test('formatType is passed through for the frontend to branch on (Standings vs Bracket)', () => {
    const t = tournamentIn(60_000, 'elimination');
    assert.equal(serializeTournament(t, null, 0).formatType, 'elimination');
  });
});
