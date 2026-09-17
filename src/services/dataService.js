// Real API-backed implementations for the resources that now have a real
// backend (Auth, Games, Puzzles, Leaderboards, Friends, Players). Anything
// NOT in this file (tournaments, clubs, openings, achievements,
// notifications, bots, lessons) has no backend yet and stays mock-only —
// see README "What's real vs mocked" for the authoritative list. This file
// intentionally never falls back to mock data on failure (spec §71 "no
// silent fallbacks"): callers get a rejected promise and must render a
// real error/empty state.
import api from './api';

export const data = {
  dailyPuzzle: () => api.get('/api/puzzles/daily').then((r) => r.data),
  puzzleCategories: () => api.get('/api/puzzles/categories').then((r) => r.data),
  puzzleById: (id) => api.get(`/api/puzzles/${id}`).then((r) => r.data),
  submitPuzzleSolve: (id, correct) => api.post(`/api/puzzles/${id}/solve`, { correct }).then((r) => r.data),

  leaderboard: (mode = 'blitz') => api.get('/api/leaderboards', { params: { mode } }).then((r) => r.data),

  players: (q = '') => api.get('/api/players', { params: { q } }).then((r) => r.data),
  findPlayer: (username) => api.get(`/api/players/${username}`).then((r) => r.data),

  friends: () => api.get('/api/friends').then((r) => r.data),
  friendRequests: () => api.get('/api/friends/requests').then((r) => r.data),
  sendFriendRequest: (userId) => api.post(`/api/friends/request/${userId}`).then((r) => r.data),
  acceptFriendRequest: (userId) => api.post(`/api/friends/accept/${userId}`).then((r) => r.data),
  declineFriendRequest: (userId) => api.post(`/api/friends/decline/${userId}`).then((r) => r.data),

  recentGames: () => api.get('/api/games/mine').then((r) => r.data),
  activeGames: () => api.get('/api/games/active').then((r) => r.data),
  gameById: (id) => api.get(`/api/games/${id}`).then((r) => r.data),

  puzzleStreak: () => api.get('/api/puzzles/streak').then((r) => r.data),

  tournaments: () => api.get('/api/tournaments').then((r) => r.data),
  tournamentById: (id) => api.get(`/api/tournaments/${id}`).then((r) => r.data),
  tournamentStandings: (id) => api.get(`/api/tournaments/${id}/standings`).then((r) => r.data),
  tournamentBracket: (id) => api.get(`/api/tournaments/${id}/bracket`).then((r) => r.data),
  tournamentSwiss: (id) => api.get(`/api/tournaments/${id}/swiss`).then((r) => r.data),
  joinTournament: (id) => api.post(`/api/tournaments/${id}/join`).then((r) => r.data),

  clubs: () => api.get('/api/clubs').then((r) => r.data),
  createClub: (payload) => api.post('/api/clubs', payload).then((r) => r.data),
  clubById: (id) => api.get(`/api/clubs/${id}`).then((r) => r.data),
  clubMembers: (id) => api.get(`/api/clubs/${id}/members`).then((r) => r.data),
  joinClub: (id) => api.post(`/api/clubs/${id}/join`).then((r) => r.data),
  leaveClub: (id) => api.post(`/api/clubs/${id}/leave`).then((r) => r.data),

  achievements: () => api.get('/api/achievements').then((r) => r.data),

  notifications: () => api.get('/api/notifications').then((r) => r.data),
  adminFlaggedGames: (status = 'pending') => api.get(`/api/admin/flagged-games?status=${status}`).then((r) => r.data),
  adminFlaggedGameDetail: (gameId) => api.get(`/api/admin/flagged-games/${gameId}`).then((r) => r.data),
  adminReviewGame: (gameId, payload) => api.post(`/api/admin/flagged-games/${gameId}/review`, payload).then((r) => r.data),
  markNotificationRead: (id) => api.post(`/api/notifications/${id}/read`).then((r) => r.data),
  markAllNotificationsRead: () => api.post('/api/notifications/read-all').then((r) => r.data),
};
