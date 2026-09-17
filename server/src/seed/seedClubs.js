import 'dotenv/config';
import { connectDB, getDB, closeDB } from '../db/connection.js';
import { createClub, findClubByName } from '../db/clubs.js';

const CLUBS = [
  { name: 'Endgame Study Group', description: 'Weekly endgame study sessions.', visibility: 'public' },
  { name: 'Bullet Bandits', description: 'Fast games, faster trash talk.', visibility: 'public' },
  { name: 'Sicilian Society', description: 'For Sicilian Defense devotees.', visibility: 'public' },
];

connectDB();
const anyUser = getDB().prepare('SELECT id FROM users ORDER BY created_at ASC LIMIT 1').get();

if (!anyUser) {
  console.log('[seed] no users exist yet — register an account first, then re-run this seed to attach an owner.');
} else {
  for (const c of CLUBS) {
    if (findClubByName(c.name)) {
      console.log(`[seed] club already exists, skipping: ${c.name}`);
      continue;
    }
    createClub({ ...c, ownerId: anyUser.id });
    console.log(`[seed] created club: ${c.name}`);
  }
  console.log('[seed] clubs done');
}
closeDB();
