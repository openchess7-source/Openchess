// Production-safe default: demo/mock behavior is OFF unless explicitly
// opted into for local development or a sandboxed preview. This means a
// real deployment with no VITE_DEMO_MODE set will correctly show guest /
// empty / error states rather than silently auto-authenticating or
// substituting fake data (spec §12 "Remove Demo Mode From Production").
//
// For local development without a backend attached, set VITE_DEMO_MODE=true.
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
