// No audio assets are bundled in this environment, so sounds are
// synthesized with the Web Audio API — same call sites a real sample-based
// SoundManager would expose, just swap the oscillator calls for
// `new Audio(url).play()` once real assets are available.
let ctx = null;
function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function tone({ freq, duration = 0.09, type = 'sine', gain = 0.05, delay = 0 }) {
  const audioCtx = getCtx();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(audioCtx.destination);
  const start = audioCtx.currentTime + delay;
  osc.start(start);
  g.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.stop(start + duration + 0.02);
}

const SOUNDS = {
  move: () => tone({ freq: 440, duration: 0.06 }),
  capture: () => tone({ freq: 300, duration: 0.09, type: 'triangle' }),
  check: () => {
    tone({ freq: 660, duration: 0.08 });
    tone({ freq: 880, duration: 0.08, delay: 0.07 });
  },
  castle: () => {
    tone({ freq: 392, duration: 0.06 });
    tone({ freq: 523, duration: 0.06, delay: 0.05 });
  },
  promotion: () => {
    [523, 659, 784].forEach((freq, i) => tone({ freq, duration: 0.1, delay: i * 0.06 }));
  },
  gameStart: () => tone({ freq: 523, duration: 0.12 }),
  gameEnd: () => {
    tone({ freq: 392, duration: 0.14 });
    tone({ freq: 262, duration: 0.18, delay: 0.12 });
  },
  notification: () => tone({ freq: 740, duration: 0.05, gain: 0.035 }),
};

function isMuted() {
  try {
    return JSON.parse(window.localStorage.getItem('oc:board-sound') ?? 'true') === false;
  } catch {
    return false;
  }
}

// Only ever called from a user-gesture-triggered handler (move, click, etc.)
// — never on page load, per spec §39 "never autoplay before interaction".
export function playSound(name) {
  if (isMuted()) return;
  const audioCtx = getCtx();
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  SOUNDS[name]?.();
}
