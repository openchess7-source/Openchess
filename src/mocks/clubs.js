export const myClubs = [
  { id: 'c_1', name: 'Night Owls Chess Club', members: 1842, online: 42, joined: true },
];

export const featuredClubs = [
  { id: 'c_2', name: 'Endgame Study Group', members: 620, online: 18, joined: false },
  { id: 'c_3', name: 'Bullet Bandits', members: 3110, online: 96, joined: false },
  { id: 'c_4', name: 'Sicilian Society', members: 940, online: 21, joined: false },
];

export function getClub(id) {
  return [...myClubs, ...featuredClubs].find((c) => c.id === id) || myClubs[0];
}

export const clubMembers = [
  { id: 'm1', name: 'MagnusFan', role: 'Owner', rating: 2842, online: true },
  { id: 'm2', name: 'AnotherPlayer', role: 'Admin', rating: 2761, online: false },
  { id: 'm3', name: 'JordanMoves', role: 'Member', rating: 1284, online: true },
  { id: 'm4', name: 'PawnStar99', role: 'Member', rating: 980, online: true },
];
