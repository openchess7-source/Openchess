import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';

function ErrorScreen({ code, title, description }) {
  const navigate = useNavigate();
  return (
    <>
      <div className="mb-3 font-display text-6xl font-bold" style={{ color: 'var(--ink-faint)' }}>{code}</div>
      <h1 className="mb-1 font-display text-lg font-bold">{title}</h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--ink-soft)' }}>{description}</p>
      <Button onClick={() => navigate('/')}>Home</Button>
    </>
  );
}

export function Error401Page() {
  return <ErrorScreen code="401" title="Log in to continue" description="You need to be signed in to view this page." />;
}
export function Error403Page() {
  return <ErrorScreen code="403" title="You don't have access" description="This page is restricted." />;
}
export function Error500Page() {
  return <ErrorScreen code="500" title="Something went wrong on our end" description="Try again in a moment." />;
}
export function OfflinePage() {
  return <ErrorScreen code="⚡" title="You're offline" description="Check your connection and try again." />;
}
export function NetworkErrorPage() {
  return <ErrorScreen code="⚠" title="Network error" description="We couldn't reach Openchess. Please try again." />;
}
