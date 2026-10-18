import React, { useEffect, useRef, useState } from 'react';
import "font-awesome/css/font-awesome.min.css";
import "primereact/resources/themes/bootstrap4-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "bootstrap/dist/css/bootstrap.css";
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Toast } from 'primereact/toast';
import { ThemeProvider } from './contexts/ThemeContext';
import LandingPage from './pages/LandingPage';
import ManualMainPage from './components/Manuals/MainPage/ManualMainPage';
import Dashboard from './components/Dashboard/Dashboard';
import CircularsList from './components/Circulars/CircularsList';
import InboxPage from './components/Features/InboxPage';
import SuggestionsPage from './components/Features/SuggestionsPage';
import CertificatesPage from './components/Features/CertificatesPage';
import SearchPage from './components/Features/SearchPage';
import authService, { AuthUser } from './services/authService';
import { registerToast } from './services/notify';
import { login as loginAction, logout as logoutAction } from './store/slices/userSlice';
import "./App.css";
import "./styles/refresh.scss";

/** Old dashboard links (/manualView?mode=new) now open the Manuals page with a filtered tree. */
const ManualViewRedirect: React.FC = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  return <Navigate to={mode && mode !== 'all' ? `/manuals?mode=${encodeURIComponent(mode)}` : '/manuals'} replace />;
};

const CircularViewerWrapper: React.FC<{ userId: string }> = ({ userId }) => {
  const [searchParams] = useSearchParams();
  const calledMode = searchParams.get('cirmode') || 'all';
  return <CircularsList userId={userId} calledMode={calledMode} focusId={searchParams.get('id')} />;
};

/** The logged-in user comes from the login token (no more hard-coded TestUser13). */
const useCurrentUser = () => {
  const dispatch = useDispatch();
  const [user, setUser] = useState<AuthUser | null>(authService.currentUser());

  useEffect(() => {
    const sync = (u: AuthUser | null) => {
      setUser(u);
      if (u) dispatch(loginAction({ id: u.userId, name: u.userName, email: '' }));
      else dispatch(logoutAction());
    };
    sync(authService.currentUser());
    return authService.onChange(sync);
  }, [dispatch]);

  // Log out automatically when the token expires.
  useEffect(() => {
    if (!user) return;
    const ms = new Date(user.expiresUtc).getTime() - Date.now();
    const id = window.setTimeout(() => authService.logout(), Math.max(0, ms));
    return () => window.clearTimeout(id);
  }, [user]);

  return user;
};

const App: React.FC = () => {
  const user = useCurrentUser();
  const toast = useRef<Toast>(null);

  useEffect(() => {
    registerToast(toast.current);
    return () => registerToast(null);
  }, []);

  return (
    <div>
      <Toast ref={toast} />
      <ThemeProvider>
        <BrowserRouter>
          {!user ? (
            <Routes>
              <Route path="*" element={<LandingPage />} />
            </Routes>
          ) : (
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard userId={user.userId} />} />
              <Route path="/main" element={<ManualMainPage userId={user.userId} />} />
              <Route path="/manuals" element={<ManualMainPage userId={user.userId} />} />
              <Route path="/manualView" element={<ManualViewRedirect />} />
              <Route path="/circulars" element={<CircularViewerWrapper userId={user.userId} />} />
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/suggestions" element={<SuggestionsPage />} />
              {/* Folders are part of Other Documents (Dashboard > Other Documents). */}
              <Route path="/folders" element={<Navigate to="/dashboard" replace state={{ activeTab: 'otherdocuments' }} />} />
              <Route path="/certificates" element={<CertificatesPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          )}
        </BrowserRouter>
      </ThemeProvider>
    </div>
  );
};

export default App;
