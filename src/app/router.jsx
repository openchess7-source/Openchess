import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import GameLayout from '../layouts/GameLayout';
import SettingsLayout from '../layouts/SettingsLayout';
import ErrorLayout from '../layouts/ErrorLayout';
import RequireAuth from './providers/RequireAuth';
import RequireAdmin from './providers/RequireAdmin';
import GuestRoute from './providers/GuestRoute';

// Home stays eager — it's the default route, no reason to show a loading
// flash on the very first page view. Every other page is code-split so
// the initial bundle only contains what's needed to render Home.
import HomePage from '../pages/home/HomePage';

const MatchmakingPage = lazy(() => import('../pages/play/MatchmakingPage'));
const CustomGamePage = lazy(() => import('../pages/play/CustomGamePage'));
const BotsPage = lazy(() => import('../pages/play/BotsPage'));

const GameRouteResolver = lazy(() => import('../pages/game/GameRouteResolver'));

const AnalysisPage = lazy(() => import('../pages/analysis/AnalysisPage'));

const PuzzleHubPage = lazy(() => import('../pages/puzzles/PuzzleHubPage'));
const PuzzleSolverPage = lazy(() => import('../pages/puzzles/PuzzleSolverPage'));
const PuzzleRushDuelPage = lazy(() => import('../pages/puzzles/PuzzleRushDuelPage'));

const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const EditProfilePage = lazy(() => import('../pages/profile/EditProfilePage'));

const GameHistoryPage = lazy(() => import('../pages/history/GameHistoryPage'));
const LeaderboardsPage = lazy(() => import('../pages/leaderboards/LeaderboardsPage'));
const PlayerSearchPage = lazy(() => import('../pages/players/PlayerSearchPage'));

const ClubsHubPage = lazy(() => import('../pages/clubs/ClubsHubPage'));
const ClubDetailsPage = lazy(() => import('../pages/clubs/ClubDetailsPage'));
const CreateClubPage = lazy(() => import('../pages/clubs/CreateClubPage'));
const ClubMembersPage = lazy(() => import('../pages/clubs/ClubMembersPage'));
const ClubTournamentPage = lazy(() => import('../pages/clubs/ClubTournamentPage'));

const TournamentHubPage = lazy(() => import('../pages/tournaments/TournamentHubPage'));
const TournamentDetailsPage = lazy(() => import('../pages/tournaments/TournamentDetailsPage'));
const TournamentBracketPage = lazy(() => import('../pages/tournaments/TournamentBracketPage'));
const TournamentStandingsPage = lazy(() => import('../pages/tournaments/TournamentStandingsPage'));

const OpeningExplorerPage = lazy(() => import('../pages/openings/OpeningExplorerPage'));
const OpeningDetailsPage = lazy(() => import('../pages/openings/OpeningDetailsPage'));

const LearnPage = lazy(() => import('../pages/learn/LearnPage'));
const LessonPage = lazy(() => import('../pages/learn/LessonPage'));

const AchievementsPage = lazy(() => import('../pages/achievements/AchievementsPage'));
const NotificationsPage = lazy(() => import('../pages/notifications/NotificationsPage'));
const FriendsPage = lazy(() => import('../pages/friends/FriendsPage'));
const ChallengePlayerPage = lazy(() => import('../pages/challenge/ChallengePlayerPage'));

const SettingsIndexPage = lazy(() => import('../pages/settings/SettingsIndexPage'));
const AdminFlaggedGamesPage = lazy(() => import('../pages/admin/AdminFlaggedGamesPage'));
const AdminFlaggedGameDetailPage = lazy(() => import('../pages/admin/AdminFlaggedGameDetailPage'));const AppearancePage = lazy(() => import('../pages/settings/AppearancePage'));
const BoardSettingsPage = lazy(() => import('../pages/settings/BoardSettingsPage'));
const GameplaySettingsPage = lazy(() => import('../pages/settings/GameplaySettingsPage'));
const NotificationSettingsPage = lazy(() => import('../pages/settings/NotificationSettingsPage'));
const PrivacyPage = lazy(() => import('../pages/settings/PrivacyPage'));
const AccessibilityPage = lazy(() => import('../pages/settings/AccessibilityPage'));

const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));

const HelpPage = lazy(() => import('../pages/help/HelpPage'));
const AboutPage = lazy(() => import('../pages/about/AboutPage'));

const NotFoundPage = lazy(() => import('../pages/errors/NotFoundPage'));
// Named exports need the .then() adapter — React.lazy only accepts modules
// with a default export.
const Error401Page = lazy(() => import('../pages/errors/ErrorStates').then((m) => ({ default: m.Error401Page })));
const Error403Page = lazy(() => import('../pages/errors/ErrorStates').then((m) => ({ default: m.Error403Page })));
const Error500Page = lazy(() => import('../pages/errors/ErrorStates').then((m) => ({ default: m.Error500Page })));
const OfflinePage = lazy(() => import('../pages/errors/ErrorStates').then((m) => ({ default: m.OfflinePage })));
const NetworkErrorPage = lazy(() => import('../pages/errors/ErrorStates').then((m) => ({ default: m.NetworkErrorPage })));

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },

      { path: '/play/:mode', element: <RequireAuth><MatchmakingPage /></RequireAuth> },
      { path: '/play/custom', element: <RequireAuth><CustomGamePage /></RequireAuth> },
      { path: '/play/bots', element: <RequireAuth><BotsPage /></RequireAuth> },

      { path: '/analysis/:id', element: <AnalysisPage /> },

      { path: '/puzzles', element: <PuzzleHubPage /> },
      { path: '/puzzles/rush', element: <PuzzleRushDuelPage /> },
      { path: '/puzzles/duel', element: <PuzzleRushDuelPage /> },
      { path: '/puzzles/:id', element: <PuzzleSolverPage /> },

      { path: '/profile/:username', element: <ProfilePage /> },

      { path: '/history', element: <RequireAuth><GameHistoryPage /></RequireAuth> },
      { path: '/leaderboards', element: <LeaderboardsPage /> },
      { path: '/players', element: <PlayerSearchPage /> },

      { path: '/clubs', element: <RequireAuth><ClubsHubPage /></RequireAuth> },
      { path: '/clubs/create', element: <RequireAuth><CreateClubPage /></RequireAuth> },
      { path: '/clubs/:clubId', element: <ClubDetailsPage /> },
      { path: '/clubs/:clubId/members', element: <ClubMembersPage /> },
      { path: '/clubs/:clubId/tournament', element: <ClubTournamentPage /> },

      { path: '/tournaments', element: <TournamentHubPage /> },
      { path: '/tournaments/:tournamentId', element: <TournamentDetailsPage /> },
      { path: '/tournaments/:tournamentId/bracket', element: <TournamentBracketPage /> },
      { path: '/tournaments/:tournamentId/standings', element: <TournamentStandingsPage /> },

      { path: '/openings', element: <OpeningExplorerPage /> },
      { path: '/openings/:openingId', element: <OpeningDetailsPage /> },

      { path: '/learn', element: <LearnPage /> },
      { path: '/learn/:lessonId', element: <LessonPage /> },

      { path: '/achievements', element: <RequireAuth><AchievementsPage /></RequireAuth> },
      { path: '/notifications', element: <RequireAuth><NotificationsPage /></RequireAuth> },
      { path: '/friends', element: <RequireAuth><FriendsPage /></RequireAuth> },
      { path: '/challenge/:username', element: <RequireAuth><ChallengePlayerPage /></RequireAuth> },

      { path: '/help', element: <HelpPage /> },
      { path: '/about', element: <AboutPage /> },

      { path: '/admin/flagged-games', element: <RequireAdmin><AdminFlaggedGamesPage /></RequireAdmin> },
      { path: '/admin/flagged-games/:gameId', element: <RequireAdmin><AdminFlaggedGameDetailPage /></RequireAdmin> },

      {
        path: '/settings',
        element: <RequireAuth><SettingsLayout /></RequireAuth>,
        children: [
          { index: true, element: <SettingsIndexPage /> },
          { path: 'profile', element: <EditProfilePage /> },
          { path: 'appearance', element: <AppearancePage /> },
          { path: 'board', element: <BoardSettingsPage /> },
          { path: 'gameplay', element: <GameplaySettingsPage /> },
          { path: 'notifications', element: <NotificationSettingsPage /> },
          { path: 'privacy', element: <PrivacyPage /> },
          { path: 'accessibility', element: <AccessibilityPage /> },
        ],
      },
    ],
  },

  {
    element: <GameLayout />,
    children: [{ path: '/game/:id', element: <RequireAuth><GameRouteResolver /></RequireAuth> }],
  },

  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <GuestRoute><LoginPage /></GuestRoute> },
      { path: '/register', element: <GuestRoute><RegisterPage /></GuestRoute> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },

  {
    element: <ErrorLayout />,
    children: [
      { path: '/401', element: <Error401Page /> },
      { path: '/403', element: <Error403Page /> },
      { path: '/500', element: <Error500Page /> },
      { path: '/offline', element: <OfflinePage /> },
      { path: '/network-error', element: <NetworkErrorPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },

]);
