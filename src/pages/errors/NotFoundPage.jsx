import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';

// PAGE 45 — chess-themed 404
export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <>
      <div className="mb-3 font-display text-6xl font-bold" style={{ color: 'var(--ink-faint)' }}>404</div>
      <h1 className="mb-1 font-display text-lg font-bold">That move doesn't exist.</h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--ink-soft)' }}>The page you're looking for isn't on the board.</p>
      <div className="flex gap-2">
        <Button onClick={() => navigate('/')}>Home</Button>
        <Button variant="secondary" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    </>
  );
}
