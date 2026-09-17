import { countUserWins } from '../db/games.js';
import { countCorrectSolves, computeStreak } from '../db/puzzles.js';
import { getDB } from '../db/connection.js';

const DEFINITIONS = [
  { id: 'first-win', icon: '🏆', label: 'First Win', rarity: 'Common', check: (ctx) => ctx.wins >= 1 },
  { id: 'ten-day-streak', icon: '🔥', label: '10 Day Streak', rarity: 'Uncommon', check: (ctx) => ctx.puzzleStreak >= 10 },
  { id: 'hundred-games', icon: '♟', label: '100 Games', rarity: 'Common', check: (ctx) => ctx.user.games >= 100 },
  { id: 'bullet-master', icon: '⚡', label: 'Bullet Master', rarity: 'Rare', check: (ctx) => ctx.user.ratings.bullet >= 2000 },
  { id: 'puzzle-pro', icon: '🧩', label: 'Puzzle Pro', rarity: 'Uncommon', check: (ctx) => ctx.correctPuzzleSolves >= 50 },
  { id: 'rated-1500', icon: '👑', label: '1500 Rated', rarity: 'Rare', check: (ctx) => Object.values(ctx.user.ratings).some((r) => r >= 1500) },
  { id: 'club-member', icon: '🤝', label: 'Club Member', rarity: 'Common', check: (ctx) => ctx.clubCount >= 1 },
  { id: 'rating-climb', icon: '📈', label: 'Rating Climb', rarity: 'Uncommon', check: (ctx) => ctx.user.peak_rating > 800 },
];

export function computeAchievements(userId, user) {
  const wins = countUserWins(userId);
  const correctPuzzleSolves = countCorrectSolves(userId);
  const puzzleStreak = computeStreak(userId);
  const clubCount = getDB().prepare('SELECT COUNT(*) AS c FROM club_members WHERE user_id = ?').get(userId).c;

  const ctx = { user, wins, correctPuzzleSolves, puzzleStreak, clubCount };

  return DEFINITIONS.map((def) => ({
    id: def.id,
    icon: def.icon,
    label: def.label,
    rarity: def.rarity,
    unlocked: def.check(ctx),
  }));
}
