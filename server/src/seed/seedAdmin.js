// There's no roles UI (and shouldn't be — self-service admin grants are
// a real security hole), so this is the honest, minimal way to bootstrap
// the first admin account: run it by hand against a real username.
//
//   node src/seed/seedAdmin.js <username>
//
import 'dotenv/config';
import { connectDB, closeDB } from '../db/connection.js';
import { findUserByUsername, setAdmin } from '../db/users.js';

const username = process.argv[2];
if (!username) {
  console.error('Usage: node src/seed/seedAdmin.js <username>');
  process.exit(1);
}

connectDB();
const user = findUserByUsername(username);
if (!user) {
  console.error(`[seed] no user found with username "${username}" — register the account first, then re-run this.`);
  process.exit(1);
}

setAdmin(user.id, true);
console.log(`[seed] granted admin access to "${username}"`);
closeDB();
