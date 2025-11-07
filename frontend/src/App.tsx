import React, { useContext, useEffect, useCallback } from 'react';
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

    // Helper function to redirect to login
    const redirectToLogin = useCallback(() => {
        localStorage.removeItem('trackboss_auth_token');
        update({ loggedIn: false, token: '', user: undefined, storedUser: undefined });
        // this is the only reasonable way to do this other than repeated string concatenation
        // eslint-disable-next-line max-len
        const authTarget = `${process.env.REACT_APP_AUTH_URL}/login?client_id=${process.env.REACT_APP_CLIENT_ID}&response_type=token&scope=email+openid+phone&redirect_uri=${window.location.origin}`;
        window.location.href = authTarget;
    }, [update]);

    // Helper function to verify token and update state
    async function updateState(token: string) {
        try {
            const user = await me(token);
            update({ loggedIn: true, token, user, storedUser: undefined });
            // Clean up URL hash after extracting token
            if (window.location.hash.includes('#id_token=')) {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
        } catch (error: any) {
            // If token is invalid (401/403) or expired, redirect to login
            if (error?.status === 401 || error?.status === 403) {
                redirectToLogin();
            } else {
                // For other errors, also redirect to login to be safe
                redirectToLogin();
            }
        }
    }

    // Effect to handle initial authentication and token validation
    useEffect(() => {
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
                redirectToLogin();
            }
        }
    }, [state.loggedIn, state.token, location.pathname, location.hash, update, redirectToLogin]);

    // Effect to periodically validate token when user is logged in
    // eslint-disable-next-line consistent-return
    useEffect(() => {
        if (state.loggedIn && state.token && !location.pathname.includes('apply')) {
            // Validate token every 5 minutes to catch expiration
            const validationInterval = setInterval(async () => {
                try {
                    await me(state.token);
                } catch (error: any) {
                    // Token is invalid or expired
                    if (error?.status === 401 || error?.status === 403) {
                        redirectToLogin();
                    }
                }
            }, 5 * 60 * 1000); // Check every 5 minutes

            return () => clearInterval(validationInterval);
        }
    }, [state.loggedIn, state.token, location.pathname, update, redirectToLogin]);

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
