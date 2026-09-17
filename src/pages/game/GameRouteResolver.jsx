import { useSearchParams } from 'react-router-dom';
import LiveGamePage from './LiveGamePage';
import FogOfWarPage from './FogOfWarPage';
import BountyPage from './BountyPage';
import HandicapPage from './HandicapPage';
import BughousePage from './BughousePage';
import BlindfoldPage from './BlindfoldPage';

const VARIANTS = {
  fog: FogOfWarPage,
  bounty: BountyPage,
  handicap: HandicapPage,
  bughouse: BughousePage,
  blindfold: BlindfoldPage,
};

export default function GameRouteResolver() {
  const [params] = useSearchParams();
  const variant = params.get('variant');
  const VariantComponent = variant && VARIANTS[variant];
  if (VariantComponent) return <VariantComponent />;
  return <LiveGamePage />;
}
