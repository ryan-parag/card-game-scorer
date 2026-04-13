import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App.tsx';
import { GameHistoryPage } from './pages/GameHistoryPage';
import { GamePage } from './pages/GamePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { NewGamePage } from './pages/NewGamePage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AcceptInvitePage } from './pages/AcceptInvitePage';
import { LeaguesPage } from './pages/LeaguesPage';
import { LeagueDetailPage } from './pages/LeagueDetailPage';
import { LeagueSeasonPage } from './pages/LeagueSeasonPage';
import { ScoringSystemPage } from './pages/ScoringSystemPage';
import { ProfilePage } from './pages/ProfilePage';
import { FindPeoplePage } from './pages/FindPeoplePage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicProfilePage } from './pages/PublicProfilePage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/new-game" element={<NewGamePage />} />
        <Route path="/game/:gameId" element={<GamePage />} />
        <Route path="/history" element={<GameHistoryPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />
        <Route path="/leagues" element={<ProtectedRoute><LeaguesPage /></ProtectedRoute>} />
        <Route path="/leagues/:leagueId" element={<ProtectedRoute><LeagueDetailPage /></ProtectedRoute>} />
        <Route path="/leagues/:leagueId/seasons/:seasonId" element={<ProtectedRoute><LeagueSeasonPage /></ProtectedRoute>} />
        <Route path="/scoring-system" element={<ProtectedRoute><ScoringSystemPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><FindPeoplePage /></ProtectedRoute>} />
        <Route path="/u/:userId" element={<PublicProfilePage />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
