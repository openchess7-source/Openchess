// Central data gateway. Pages import `mock.*` uniformly; under the hood,
// resources that now have a real backend (see dataService.js) route
// through it whenever DEMO_MODE is off, and reject for real on failure —
// they never silently substitute fake data (spec §71). Resources with no
// backend yet (openings, bots, lessons) always use the static mock
// fixtures, clearly documented as such in README.
import * as players from '../mocks/players';
import * as games from '../mocks/games';
import * as puzzles from '../mocks/puzzles';
import * as tournaments from '../mocks/tournaments';
import * as clubs from '../mocks/clubs';
import * as openings from '../mocks/openings';
import * as misc from '../mocks/misc';
import { data } from './dataService';
import { DEMO_MODE } from '../config/env';

const LATENCY = 220;
const delay = (v) => new Promise((res) => setTimeout(() => res(v), LATENCY));

export const mock = {
  // ---- Backed by a real API when DEMO_MODE=false ----
  currentUser: () => delay(players.currentUser), // always via /api/auth/me through AuthProvider, not here
  findPlayer: (username) => (DEMO_MODE ? delay(players.findPlayer(username)) : data.findPlayer(username)),
  players: (q) => (DEMO_MODE ? delay(players.players) : data.players(q)),

  recentGames: () => (DEMO_MODE ? delay(games.recentGames) : data.recentGames()),
  activeGames: () => (DEMO_MODE ? delay(games.activeGames) : data.activeGames()),
  gameById: (id) => (DEMO_MODE ? delay(games.getGameById(id)) : data.gameById(id)),

  dailyPuzzle: () => (DEMO_MODE ? delay(puzzles.dailyPuzzle) : data.dailyPuzzle()),
  puzzleCategories: () => (DEMO_MODE ? delay(puzzles.puzzleCategories) : data.puzzleCategories()),
  puzzleById: (id) => (DEMO_MODE ? delay(puzzles.getPuzzleById(id)) : data.puzzleById(id)),
  puzzleStreak: () => (DEMO_MODE ? delay({ streak: puzzles.dailyPuzzle.streak }) : data.puzzleStreak()),

  leaderboard: (mode) => (DEMO_MODE ? delay(misc.leaderboard) : data.leaderboard(mode)),

  friends: () => (DEMO_MODE ? delay(misc.friends) : data.friends()),
  friendRequests: () => (DEMO_MODE ? delay(misc.friendRequests) : data.friendRequests()),

  tournaments: () => (DEMO_MODE ? delay(tournaments.tournaments) : data.tournaments()),
  tournamentById: (id) => (DEMO_MODE ? delay(tournaments.getTournament(id)) : data.tournamentById(id)),
  standings: (id) => (DEMO_MODE ? delay(tournaments.standings) : data.tournamentStandings(id)),
  bracket: (id) => (DEMO_MODE ? delay(tournaments.buildBracket()) : data.tournamentBracket(id)),
  swiss: (id) => (DEMO_MODE ? delay(tournaments.buildSwissRound()) : data.tournamentSwiss(id)),

  myClubs: () => (DEMO_MODE ? delay(clubs.myClubs) : data.clubs().then((r) => r.myClubs)),
  featuredClubs: () => (DEMO_MODE ? delay(clubs.featuredClubs) : data.clubs().then((r) => r.featuredClubs)),
  clubById: (id) => (DEMO_MODE ? delay(clubs.getClub(id)) : data.clubById(id)),
  clubMembers: (id) => (DEMO_MODE ? delay(clubs.clubMembers) : data.clubMembers(id)),

  achievements: () => (DEMO_MODE ? delay(misc.achievements) : data.achievements()),
  notifications: () => (DEMO_MODE ? delay(misc.notifications) : data.notifications()),

  adminFlaggedGames: (status) => (DEMO_MODE ? delay(misc.adminFlaggedGames(status)) : data.adminFlaggedGames(status)),
  adminFlaggedGameDetail: (id) => (DEMO_MODE ? delay(misc.adminFlaggedGameDetail(id)) : data.adminFlaggedGameDetail(id)),
  adminReviewGame: (id, payload) => (DEMO_MODE ? delay(misc.adminReviewGame(id, payload)) : data.adminReviewGame(id, payload)),

  // ---- Still mock-only: no backend built for these yet ----

  openings: () => delay(openings.openings),
  openingById: (id) => delay(openings.getOpening(id)),

  bots: () => delay(misc.bots),
  lessons: () => delay(misc.lessons),
  lessonById: (id) => delay(misc.getLesson(id)),
};
