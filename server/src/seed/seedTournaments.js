import 'dotenv/config';
import { connectDB, closeDB } from '../db/connection.js';
import { upsertTournament } from '../db/tournaments.js';

const now = Date.now();

const TOURNAMENTS = [
  { name: 'Blitz Arena', format: 'Arena', formatType: 'arena', mode: 'blitz', initial: 300, increment: 0, startsAt: new Date(now + 2 * 60 * 60 * 1000 + 13 * 60 * 1000).toISOString() },
  { name: 'Weekend Rapid Swiss', format: 'Swiss · 7 rounds', formatType: 'swiss', totalRounds: 7, mode: 'rapid', initial: 900, increment: 10, startsAt: new Date(now - 30 * 60 * 1000).toISOString() },
  // Starts in the near future rather than the past, so registering right
  // after seeding still gets you into the bracket before it locks.
  { name: 'Bullet Bracket', format: 'Single elimination', formatType: 'elimination', mode: 'bullet', initial: 60, increment: 0, startsAt: new Date(now + 10 * 60 * 1000).toISOString() },
];

connectDB();
for (const t of TOURNAMENTS) {
  upsertTournament(t);
  console.log(`[seed] upserted tournament: ${t.name}`);
}
console.log('[seed] tournaments done');
closeDB();
