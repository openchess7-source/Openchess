import { useEffect, useState } from 'react';
// Clubs have no real backend yet (see README), so this page intentionally
// reads the tournament mock fixtures directly rather than through
// mockService's `mock` gateway, which now routes tournament data to the
// real API when DEMO_MODE is off — that API has no tournament literally
// named 't_1', so going through it here would 404 for no good reason.
import { getTournament, standings as mockStandings } from '../../mocks/tournaments';
import TournamentCard from '../../components/tournaments/TournamentCard';
import StandingsRow from '../../components/tournaments/StandingsRow';
import Panel from '../../components/common/Panel';
import SectionTitle from '../../components/common/SectionTitle';
import LoadingState from '../../components/common/LoadingState';

export default function ClubTournamentPage() {
  const [tournament, setTournament] = useState(null);

  useEffect(() => {
    setTournament(getTournament('t_1'));
  }, []);

  if (!tournament) return <LoadingState label="Loading tournament" />;

  return (
    <div className="mx-auto max-w-xl px-4 pb-10 pt-4">
      <h1 className="mb-4 font-display text-lg font-bold">Club tournament</h1>
      <TournamentCard tournament={tournament} onJoin={() => {}} />
      <SectionTitle className="!px-0">Standings</SectionTitle>
      <Panel>
        {mockStandings.map((s) => <StandingsRow key={s.rank} row={s} />)}
      </Panel>
    </div>
  );
}
