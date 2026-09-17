import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mock } from '../../services/mockService';
import { data as realData } from '../../services/dataService';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useToast } from '../../app/providers/ToastProvider';
import { DEMO_MODE } from '../../config/env';
import ClubCard from '../../components/clubs/ClubCard';
import Panel from '../../components/common/Panel';
import SectionTitle from '../../components/common/SectionTitle';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

export default function ClubsHubPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const myClubsState = useAsyncData(() => mock.myClubs(), []);
  const featuredState = useAsyncData(() => mock.featuredClubs(), []);

  if (myClubsState.status === 'loading' || featuredState.status === 'loading') return <LoadingState label="Loading clubs" />;
  if (myClubsState.status === 'error') return <ErrorState message={myClubsState.error} onRetry={myClubsState.retry} />;
  if (featuredState.status === 'error') return <ErrorState message={featuredState.error} onRetry={featuredState.retry} />;

  const myClubs = myClubsState.data;
  const featured = featuredState.data;

  async function handleJoin(clubId) {
    if (DEMO_MODE) return toast('Demo mode — connect a real backend to join', 'info');
    try {
      await realData.joinClub(clubId);
      toast('Joined the club', 'success');
      myClubsState.retry();
      featuredState.retry();
    } catch (err) {
      toast(err.message || 'Could not join', 'error');
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-10 pt-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-lg font-bold">Clubs</h1>
        <Button className="!px-3.5 !py-2 text-xs" onClick={() => navigate('/clubs/create')}>Create</Button>
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search clubs"
        className="mb-5 w-full rounded-sm border px-3.5 py-2.5 text-sm"
        style={{ borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
      />

      <SectionTitle className="!px-0">My clubs</SectionTitle>
      {myClubs.length === 0 ? (
        <EmptyState icon="♞" title="Find your chess community" description="Join a club to play with people who share your style and schedule." className="mb-5" />
      ) : (
        <Panel className="mb-5">
          {myClubs.map((c) => (
            <ClubCard key={c.id} club={c} onOpen={() => navigate(`/clubs/${c.id}`)} />
          ))}
        </Panel>
      )}

      <SectionTitle className="!px-0">Featured clubs</SectionTitle>
      <Panel>
        {featured
          .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
          .map((c) => (
            <ClubCard key={c.id} club={c} onOpen={() => navigate(`/clubs/${c.id}`)} onJoin={() => handleJoin(c.id)} />
          ))}
      </Panel>
    </div>
  );
}
