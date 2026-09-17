import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import Board from '../../components/chess/Board';
import Clock from '../../components/chess/Clock';
import MoveList from '../../components/chess/MoveList';
import GameSkeleton from '../../components/chess/GameSkeleton';
import ReconnectBanner from '../../components/games/ReconnectBanner';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import BottomSheet from '../../components/common/BottomSheet';
import SidePanel from '../../components/common/SidePanel';
import { useAuth } from '../../app/providers/AuthProvider';
import { useToast } from '../../app/providers/ToastProvider';
import { useTimeControl } from '../../hooks/useTimeControl';
import { connectSocket, makeMove, offerDraw, onServerEvent, resignGame } from '../../services/socketService';
import { playSound } from '../../services/soundService';
import { glyphFor } from '../../components/chess/pieceGlyphs';

const STANDARD_COUNTS = { p: 8, n: 2, b: 2, r: 2, q: 1 };

function capturedPieces(boardMatrix, color) {
  const counts = { p: 0, n: 0, b: 0, r: 0, q: 0 };
  boardMatrix.flat().forEach((sq) => {
    if (sq && sq.color === color && counts[sq.type] !== undefined) counts[sq.type]++;
  });
  const captured = [];
  Object.entries(STANDARD_COUNTS).forEach(([type, max]) => {
    const missing = max - counts[type];
    for (let i = 0; i < missing; i++) captured.push(glyphFor({ type, color }));
  });
  return captured;
}

function buildPairs(historySan) {
  const pairs = [];
  for (let i = 0; i < historySan.length; i += 2) {
    pairs.push({ no: i / 2 + 1, white: historySan[i], black: historySan[i + 1] });
  }
  return pairs;
}

function AnimatedRating({ from, to }) {
  const [value, setValue] = useState(from);
  useEffect(() => {
    const start = performance.now();
    const duration = 700;
    let raf;
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to]);
  return <span>{value}</span>;
}

export default function LiveGamePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [lastTC, setLastTC] = useTimeControl();

  const [ready, setReady] = useState(false);
  const [historySan, setHistorySan] = useState([]);
  const [currentFen, setCurrentFen] = useState(new Chess().fen());
  const [turn, setTurn] = useState('white');
  const [gameOver, setGameOver] = useState(null); // { result, reason }
  const [activeTab, setActiveTab] = useState('moves');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [resignConfirmOpen, setResignConfirmOpen] = useState(false);
  const [incomingDrawOffer, setIncomingDrawOffer] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('local'); // 'connected' | 'local' | 'disconnected' | 'reconnected'
  const [disconnectCountdown, setDisconnectCountdown] = useState(30);
  const lastMoveRef = useRef(null);
  const [, forceRerender] = useState(0);

  const initial = lastTC.initial || 300;
  const increment = lastTC.increment || 0;
  const [whiteSeconds, setWhiteSeconds] = useState(initial);
  const [blackSeconds, setBlackSeconds] = useState(initial);

  // Simulate the initial "board skeleton -> ready" loading state (spec §41).
  useEffect(() => {
    playSound('gameStart');
    const t = setTimeout(() => setReady(true), 450);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    try {
      connectSocket();
      const offMove = onServerEvent('move_made', (payload) => {
        setHistorySan((h) => [...h, payload.move.san]);
        setTurn(payload.turn);
        if (payload.fen) setCurrentFen(payload.fen);
        // Server clock is authoritative — resync on every server-confirmed
        // move rather than trusting the client's own running countdown.
        if (typeof payload.whiteRemainingMs === 'number') setWhiteSeconds(payload.whiteRemainingMs / 1000);
        if (typeof payload.blackRemainingMs === 'number') setBlackSeconds(payload.blackRemainingMs / 1000);
      });
      const offOver = onServerEvent('game_over', (payload) => setGameOver(payload));
      const offDisconnect = onServerEvent('opponent_disconnected', () => setConnectionStatus('disconnected'));
      const offReconnect = onServerEvent('opponent_reconnected', () => setConnectionStatus('reconnected'));
      const offDraw = onServerEvent('offer_draw', () => setIncomingDrawOffer(true));
      return () => {
        offMove();
        offOver();
        offDisconnect();
        offReconnect();
        offDraw();
      };
    } catch {
      return undefined;
    }
  }, []);

  // Disconnect countdown ticks while status is 'disconnected' (spec §68).
  useEffect(() => {
    if (connectionStatus !== 'disconnected') return undefined;
    setDisconnectCountdown(30);
    const interval = setInterval(() => setDisconnectCountdown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(interval);
  }, [connectionStatus]);

  function handleLegalMove(move) {
    lastMoveRef.current = { from: move.from, to: move.to };
    setHistorySan((h) => [...h, move.san]);
    setTurn(move.turn);
    setCurrentFen(move.fen);
    if (move.turn === 'black') setWhiteSeconds((s) => s + increment);
    else setBlackSeconds((s) => s + increment);

    if (move.isCheckmate) playSound('check');
    else if (move.promotion) playSound('promotion');
    else if (move.flags?.includes('k') || move.flags?.includes('q')) playSound('castle');
    else if (move.captured) playSound('capture');
    else if (move.isCheck) playSound('check');
    else playSound('move');

    try {
      makeMove({ gameId: id, from: move.from, to: move.to, promotion: move.promotion });
    } catch {
      // no live socket — local board remains the source of truth for this demo
    }

    if (move.isCheckmate) {
      playSound('gameEnd');
      setGameOver({ result: move.turn === 'white' ? 'black' : 'white', reason: 'checkmate' });
    } else if (move.isGameOver) {
      playSound('gameEnd');
      setGameOver({ result: 'draw', reason: 'stalemate' });
    }
    forceRerender((n) => n + 1);
  }

  function confirmResign() {
    setResignConfirmOpen(false);
    try {
      resignGame(id);
    } catch {
      // demo mode
    }
    playSound('gameEnd');
    setGameOver({ result: turn === 'white' ? 'black' : 'white', reason: 'resignation' });
  }

  function handleOfferDraw() {
    try {
      offerDraw(id);
    } catch {
      // demo mode
    }
    toast('Draw offer sent', 'game');
  }

  function respondToDrawOffer(accept) {
    setIncomingDrawOffer(false);
    if (accept) {
      playSound('gameEnd');
      setGameOver({ result: 'draw', reason: 'draw-agreement' });
    } else {
      toast('Draw declined', 'info');
    }
  }

  function playAgain() {
    setLastTC(lastTC); // keep the same time control queued
    navigate('/play/quick');
  }

  const pairs = useMemo(() => buildPairs(historySan), [historySan]);
  const boardMatrix = useMemo(() => new Chess(currentFen).board(), [currentFen]);
  const whiteCaptured = useMemo(() => capturedPieces(boardMatrix, 'b'), [boardMatrix]);
  const blackCaptured = useMemo(() => capturedPieces(boardMatrix, 'w'), [boardMatrix]);
  const opponent = { name: 'KnightHunter', rating: 1301, initials: 'KH' };
  const you = { name: user?.username || 'You', rating: user?.ratings?.blitz ?? 1284, initials: user?.avatarInitials || 'YO' };
  const ratingDelta = gameOver ? (gameOver.result === 'white' ? 8 : gameOver.result === 'black' ? -8 : 0) : 0;

  if (!ready) return <GameSkeleton />;

  const movesPanel = <MoveList pairs={pairs} />;
  const chatPanel = <div className="py-8 text-center text-sm" style={{ color: 'var(--ink-faint)' }}>No messages yet</div>;
  const morePanel = <div className="py-2 text-sm" style={{ color: 'var(--ink-soft)' }}>Board flip, sound, and premove settings live in Settings → Board & Pieces.</div>;

  return (
    <div className="mx-auto max-w-5xl md:flex">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between px-4 py-2.5 md:px-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border font-display text-xs font-bold" style={{ background: 'var(--surface-alt)', borderColor: 'var(--line)' }}>
              {opponent.initials}
            </div>
            <div>
              <span className="text-[13.5px] font-semibold">{opponent.name}</span>
              <span className="ml-1.5 text-xs" style={{ color: 'var(--ink-soft)' }}>{opponent.rating}</span>
            </div>
          </div>
          <Clock seconds={blackSeconds} isRunning={!gameOver && turn === 'black'} onTimeout={() => { playSound('gameEnd'); setGameOver({ result: 'white', reason: 'timeout' }); }} />
        </div>

        <div className="flex min-h-[22px] flex-wrap gap-0.5 px-4 pb-1.5 text-lg leading-none md:px-1">
          {blackCaptured.map((g, i) => <span key={i}>{g}</span>)}
        </div>

        <div className="px-3 md:px-1">
          <Board fen={undefined} orientation="white" interactive={!gameOver} lastMove={lastMoveRef.current} onLegalMove={handleLegalMove} className="mx-auto max-w-[600px]" />
        </div>

        <div className="flex items-center justify-between px-4 pt-2.5 md:px-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border font-display text-xs font-bold" style={{ background: 'var(--surface-alt)', borderColor: 'var(--line)' }}>
              {you.initials}
            </div>
            <div>
              <span className="text-[13.5px] font-semibold">{you.name}</span>
              <span className="ml-1.5 text-xs" style={{ color: 'var(--ink-soft)' }}>{you.rating}</span>
            </div>
          </div>
          <Clock seconds={whiteSeconds} isRunning={!gameOver && turn === 'white'} onTimeout={() => { playSound('gameEnd'); setGameOver({ result: 'black', reason: 'timeout' }); }} />
        </div>
        <div className="flex min-h-[22px] flex-wrap gap-0.5 px-4 pt-1 text-lg leading-none md:px-1">
          {whiteCaptured.map((g, i) => <span key={i}>{g}</span>)}
        </div>

        <ReconnectBanner status={connectionStatus} countdown={`00:${String(disconnectCountdown).padStart(2, '0')}`} />

        {connectionStatus === 'local' && (
          <div className="mx-4 mt-3 rounded-sm px-3 py-2 text-center text-[11px] font-semibold md:mx-1" style={{ background: 'var(--warning-tint)', color: 'var(--warning)' }}>
            Playing locally — connect a live backend to matchmake in real time
          </div>
        )}

        {gameOver && (
          <div className="mx-4 mt-3 animate-fade-in rounded-md border p-5 text-center md:mx-1" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
            <div className="mb-1 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>
              {gameOver.reason.replace('-', ' ')}
            </div>
            <div className="mb-3 font-display text-xl font-bold">
              {gameOver.result === 'draw' ? 'Draw' : gameOver.result === 'white' ? 'You win' : 'You lose'}
            </div>
            <div className="mb-4 flex items-center justify-center gap-2 font-display text-2xl font-bold" style={{ color: ratingDelta >= 0 ? 'var(--win)' : 'var(--loss)' }}>
              <AnimatedRating from={you.rating} to={you.rating + ratingDelta} />
              <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>{ratingDelta >= 0 ? `+${ratingDelta}` : ratingDelta}</span>
            </div>
            <div className="flex justify-center gap-2">
              <Button onClick={() => navigate(`/analysis/${id}`)}>Review game</Button>
              <Button variant="secondary" onClick={playAgain}>Play again</Button>
            </div>
          </div>
        )}

        {!gameOver && (
          <div className="flex gap-2 px-4 pb-5 pt-3 md:hidden">
            <Button variant="secondary" className="flex-1" onClick={() => setSheetOpen(true)}>Moves & chat</Button>
            <Button variant="secondary" className="flex-1" style={{ color: 'var(--info)' }} onClick={handleOfferDraw}>Offer draw</Button>
            <Button variant="danger" className="flex-1" onClick={() => setResignConfirmOpen(true)}>Resign</Button>
          </div>
        )}
      </div>

      <SidePanel
        title={
          <div className="flex">
            {['moves', 'chat', 'more'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 border-b-2 py-2.5 text-[13px] font-semibold capitalize"
                style={{ borderColor: activeTab === tab ? 'var(--accent)' : 'transparent', color: activeTab === tab ? 'var(--ink)' : 'var(--ink-faint)' }}
              >
                {tab}
              </button>
            ))}
          </div>
        }
      >
        <div className="min-h-[140px] px-4 py-3">
          {activeTab === 'moves' && movesPanel}
          {activeTab === 'chat' && chatPanel}
          {activeTab === 'more' && morePanel}
        </div>
        {!gameOver && (
          <div className="flex gap-2 px-4 pb-5 pt-2">
            <Button variant="secondary" className="flex-1" style={{ color: 'var(--info)' }} onClick={handleOfferDraw}>Offer draw</Button>
            <Button variant="danger" className="flex-1" onClick={() => setResignConfirmOpen(true)}>Resign</Button>
          </div>
        )}
      </SidePanel>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Game">
        <div className="mb-3 flex gap-1.5">
          {['moves', 'chat', 'more'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="rounded-full border px-3 py-1.5 text-xs font-bold capitalize"
              style={{ borderColor: activeTab === tab ? 'var(--accent)' : 'var(--line)', background: activeTab === tab ? 'var(--accent-tint)' : 'transparent' }}
            >
              {tab}
            </button>
          ))}
        </div>
        {activeTab === 'moves' && movesPanel}
        {activeTab === 'chat' && chatPanel}
        {activeTab === 'more' && morePanel}
      </BottomSheet>

      <ConfirmDialog
        open={resignConfirmOpen}
        title="Resign this game?"
        description="This will count as a loss and cannot be undone."
        confirmLabel="Resign"
        danger
        onConfirm={confirmResign}
        onCancel={() => setResignConfirmOpen(false)}
      />

      <ConfirmDialog
        open={incomingDrawOffer}
        title="Draw offer"
        description="Your opponent wants a draw."
        confirmLabel="Accept"
        cancelLabel="Decline"
        onConfirm={() => respondToDrawOffer(true)}
        onCancel={() => respondToDrawOffer(false)}
      />
    </div>
  );
}
