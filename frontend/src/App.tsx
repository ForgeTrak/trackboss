import React, { useContext, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { UserContext, UserContextProvider } from './contexts/UserContext';
import Dashboard from './pages/Dashboard';
import MemberListPage from './pages/MemberListPage';
import Settings from './pages/Settings';
import CalendarPage from './pages/CalendarPage';
import SignUpPage from './pages/SignUpPage';
import me from './controller/api';
import MemberCommunicationsPage from './pages/MemberCommunicationsPage';
import ApplicationForm from './pages/ApplicationForm';
import RaceAdministration from './pages/RaceAdministration';
import EarlySeasonPage from './pages/EarlySeasonPage';

export function App() {
    const { state, update } = useContext(UserContext);
    const location = useLocation();
    useEffect(() => {
        async function updateState(token: string) {
            try {
                const user = await me(token);
                update({ loggedIn: true, token, user, storedUser: undefined });
                // Clean up URL hash after extracting token
                if (window.location.hash.includes('#id_token=')) {
                    window.history.replaceState(null, '', window.location.pathname + window.location.search);
                }
            } catch (error) {
                // If token is invalid, clear it and redirect to login
                localStorage.removeItem('trackboss_auth_token');
                update({ loggedIn: false, token: '', user: undefined, storedUser: undefined });
                // this is the only reasonable way to do this other than repeated string concatenation
                // eslint-disable-next-line max-len
                const authTarget = `${process.env.REACT_APP_AUTH_URL}/login?client_id=${process.env.REACT_APP_CLIENT_ID}&response_type=token&scope=email+openid+phone&redirect_uri=${window.location.origin}`;
                window.location.href = authTarget;
            }
        }
        if (!state.loggedIn && !location.pathname.includes('apply')) {
            // First check if there's a token in the URL hash (from Cognito redirect)
            const hash = location.hash.split('#id_token=')[1];
            if (hash) {
                const token = hash.split('&')[0];
                updateState(token);
            } else if (state.token) {
                // If no hash but we have a stored token, try to verify it
                updateState(state.token);
            } else {
                // No token at all, redirect to login
                // this is the only reasonable way to do this other than repeated string concatenation
                // eslint-disable-next-line max-len
                const authTarget = `${process.env.REACT_APP_AUTH_URL}/login?client_id=${process.env.REACT_APP_CLIENT_ID}&response_type=token&scope=email+openid+phone&redirect_uri=${window.location.origin}`;
                window.location.href = authTarget;
            }
        }
    }, [state.loggedIn, state.token, location.pathname, location.hash, update]);

    return (
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="members" element={<MemberListPage />} />
            <Route path="settings" element={<Settings />} />
            <Route path="calendar/signups/:date/:eventId/:eventType" element={<SignUpPage />} />
            <Route path="administration" element={<RaceAdministration />} />
            <Route path="early" element={<EarlySeasonPage />} />
            <Route path="communicate" element={<MemberCommunicationsPage />} />
            <Route path="apply" element={<ApplicationForm />} />
        </Routes>
    );
}

export function AppWrapper() {
    return (
        <UserContextProvider>
            <App />
        </UserContextProvider>
    );
}
