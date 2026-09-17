import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError('Enter a valid email address');
      return;
    }
    setError(null);
    // TODO: wire to a real /api/auth/forgot-password endpoint once it exists.
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full text-xl" style={{ background: 'var(--win-tint)', color: 'var(--win)' }}>✓</div>
        <h1 className="mb-2 font-display text-lg font-bold">Check your email</h1>
        <p className="mb-6 text-sm" style={{ color: 'var(--ink-soft)' }}>
          If an account exists for {email}, we've sent a link to reset your password.
        </p>
        <Link to="/login" style={{ color: 'var(--accent)' }}>Back to log in</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-1 text-center text-3xl" style={{ color: 'var(--accent)' }}>♟</div>
      <h1 className="mb-2 text-center font-display text-xl font-bold">Reset your password</h1>
      <p className="mb-6 text-center text-sm" style={{ color: 'var(--ink-soft)' }}>Enter your email and we'll send you a reset link.</p>

      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>Email</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-2 w-full rounded-sm border px-3 py-2.5 text-sm" style={{ borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink)' }} />
      {error && <div className="mb-3 text-xs font-semibold" style={{ color: 'var(--loss)' }}>{error}</div>}

      <Button type="submit" className="mb-4 mt-2 w-full !py-3">Send reset link</Button>
      <div className="text-center text-sm">
        <Link to="/login" style={{ color: 'var(--accent)' }}>Back to log in</Link>
      </div>
    </form>
  );
}
