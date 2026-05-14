import React, { useContext, useEffect, useCallback } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import getTenantBySlug from './controller/tenant';
import { UserContext, UserContextProvider } from './contexts/UserContext';
import AppProvider from './components/AppProvider';
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
import { buildOAuthState } from './util/oauthState';
import CallbackPage from './pages/CallbackPage';

export function App() {
    const { state, update } = useContext(UserContext);
    const location = useLocation();

    // Helper function to redirect to login
    const redirectToLogin = useCallback(async () => {
        localStorage.removeItem('trackboss_auth_token');
        update({ loggedIn: false, token: '', user: undefined, storedUser: undefined, isInitializing: false });
        const hostFirstPart = window.location.hostname.split('.')[0];
        const tenant = await getTenantBySlug(hostFirstPart);
        const encodedState = buildOAuthState({ tenant, origin: window.location.origin });
        // this is the only reasonable way to do this other than repeated string concatenation
        // eslint-disable-next-line max-len
        const authTarget = `${import.meta.env.VITE_AUTH_URL}/login?client_id=${import.meta.env.VITE_CLIENT_ID}&state=${encodedState}&response_type=token&scope=email+openid+phone&redirect_uri=${import.meta.env.VITE_CALLBACK_URL}`;
        window.location.href = authTarget;
    }, [update]);

    // Helper function to verify token and update state
    const updateState = useCallback(async (token: string) => {
        // Set initializing to true while we verify the token
        update((prev) => ({ ...prev, isInitializing: true }));
        try {
            const user = await me(token);
            // Token is valid, set loggedIn to true and isInitializing to false
            update({ loggedIn: true, token, user, storedUser: undefined, isInitializing: false });
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
    }, [update, redirectToLogin]);

    // Effect to handle initial authentication and token validation
    useEffect(() => {
        const isPublicPage = location.pathname.includes('apply') || location.pathname.includes('callback');
        if (!state.loggedIn && state.isInitializing && !isPublicPage) {
            // First check if there's a token in the URL hash (from Cognito redirect)
            const hashStr = location.hash.split('#id_token=')[1];
            if (hashStr) {
                const token = hashStr.split('&')[0];
                updateState(token);
            } else if (state.token) {
                // If no hash but we have a stored token, try to verify it
                updateState(state.token);
            } else {
                // No token at all, redirect to login
                redirectToLogin();
            }
        }
    }, [
        state.loggedIn,
        state.token,
        state.isInitializing,
        location.pathname,
        location.hash,
        updateState,
        redirectToLogin,
    ]);

    // Effect to periodically validate token when user is logged in
    // eslint-disable-next-line consistent-return
    useEffect(() => {
        const isPublicPath = location.pathname.includes('apply') || location.pathname.includes('callback');
        if (state.loggedIn && state.token && !isPublicPath) {
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

    // Don't render routes until authentication is complete (either logged in or redirected)
    // This prevents components from making API calls with invalid/empty tokens
    const isPublicRoute = location.pathname.includes('apply') || location.pathname.includes('callback');
    if (state.isInitializing && !isPublicRoute) {
        return null; // or a loading spinner if desired
    }

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
            <Route path="callback" element={<CallbackPage />} />
        </Routes>
    );
}

export function AppWrapper() {
    return (
        <AppProvider>
            <UserContextProvider>
                <App />
            </UserContextProvider>
        </AppProvider>
    );
}
