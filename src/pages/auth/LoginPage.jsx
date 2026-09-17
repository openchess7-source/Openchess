import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import Button from '../../components/common/Button';

const inputStyle = { borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink)' };

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.from || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ usernameOrEmail, password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to log in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-1 text-center text-3xl" style={{ color: 'var(--accent)' }}>♟</div>
      <h1 className="mb-6 text-center font-display text-xl font-bold">Welcome back</h1>

      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>Username or email</label>
      <input value={usernameOrEmail} onChange={(e) => setUsernameOrEmail(e.target.value)} required className="mb-4 w-full rounded-sm border px-3 py-2.5 text-sm" style={inputStyle} />

      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>Password</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mb-2 w-full rounded-sm border px-3 py-2.5 text-sm" style={inputStyle} />

      {error && <div className="mb-3 rounded-sm px-3 py-2 text-xs font-semibold" style={{ background: 'var(--loss-tint)', color: 'var(--loss)' }}>{error}</div>}

      <Button type="submit" disabled={loading} className="mb-4 mt-2 w-full !py-3">{loading ? 'Logging in…' : 'Log in'}</Button>

      <div className="text-center text-sm">
        <Link to="/forgot-password" style={{ color: 'var(--accent)' }}>Forgot password?</Link>
      </div>
      <div className="mt-3 text-center text-sm" style={{ color: 'var(--ink-soft)' }}>
        Don't have an account? <Link to="/register" style={{ color: 'var(--accent)' }}>Create account</Link>
      </div>
    </form>
  );
}
