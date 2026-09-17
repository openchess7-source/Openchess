import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import Button from '../../components/common/Button';

const inputStyle = { borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink)' };

function passwordStrength(pw) {
  if (pw.length === 0) return { label: '', pct: 0, color: 'var(--ink-faint)' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: 'Weak', color: 'var(--loss)' },
    { label: 'Fair', color: 'var(--warning)' },
    { label: 'Good', color: 'var(--info)' },
    { label: 'Strong', color: 'var(--win)' },
  ];
  const level = levels[Math.max(0, score - 1)] || levels[0];
  return { ...level, pct: (score / 4) * 100 };
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '', terms: false });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const strength = passwordStrength(form.password);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (!form.terms) return setError('You must accept the terms to continue');
    setLoading(true);
    try {
      await register({ username: form.username, email: form.email, password: form.password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-1 text-center text-3xl" style={{ color: 'var(--accent)' }}>♟</div>
      <h1 className="mb-6 text-center font-display text-xl font-bold">Create your account</h1>

      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>Username</label>
      <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required className="mb-3.5 w-full rounded-sm border px-3 py-2.5 text-sm" style={inputStyle} />

      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>Email</label>
      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="mb-3.5 w-full rounded-sm border px-3 py-2.5 text-sm" style={inputStyle} />

      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>Password</label>
      <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="mb-1.5 w-full rounded-sm border px-3 py-2.5 text-sm" style={inputStyle} />
      {form.password && (
        <div className="mb-3.5">
          <div className="h-1 overflow-hidden rounded-full" style={{ background: 'var(--surface-alt)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${strength.pct}%`, background: strength.color }} />
          </div>
          <div className="mt-1 text-[11px] font-semibold" style={{ color: strength.color }}>{strength.label}</div>
        </div>
      )}

      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>Confirm password</label>
      <input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required className="mb-3.5 w-full rounded-sm border px-3 py-2.5 text-sm" style={inputStyle} />

      <label className="mb-4 flex items-center gap-2 text-xs" style={{ color: 'var(--ink-soft)' }}>
        <input type="checkbox" checked={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.checked })} />
        I agree to the Terms of Service and Privacy Policy
      </label>

      {error && <div className="mb-3 rounded-sm px-3 py-2 text-xs font-semibold" style={{ background: 'var(--loss-tint)', color: 'var(--loss)' }}>{error}</div>}

      <Button type="submit" disabled={loading} className="mb-4 w-full !py-3">{loading ? 'Creating account…' : 'Create account'}</Button>

      <div className="text-center text-sm" style={{ color: 'var(--ink-soft)' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--accent)' }}>Log in</Link>
      </div>
    </form>
  );
}
