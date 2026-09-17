import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

let socket = null;

/**
 * Lazily creates a single shared socket connection, authenticated via
 * the session cookie (spec §17 — no manual token in the handshake).
 */
export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false,
      transports: ['websocket'],
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}

/* ---------------- Emitters (spec §17) ---------------- */

export function joinQueue({ mode, timeControl }) {
  getSocket().emit('join_queue', { mode, timeControl });
}

export function leaveQueue() {
  getSocket().emit('leave_queue');
}

export function makeMove({ gameId, from, to, promotion = null }) {
  getSocket().emit('make_move', { gameId, from, to, promotion });
}

export function resignGame(gameId) {
  getSocket().emit('resign', { gameId });
}

export function offerDraw(gameId) {
  getSocket().emit('offer_draw', { gameId });
}

export function respondDraw(gameId, accept) {
  getSocket().emit('draw_response', { gameId, accept });
}

/* ---------------- Listener registration helper ---------------- */
// Server events: match_found, move_made, invalid_move, offer_draw,
// draw_response, game_over, opponent_disconnected, opponent_reconnected.
export function onServerEvent(event, handler) {
  const s = getSocket();
  s.on(event, handler);
  return () => s.off(event, handler);
}
