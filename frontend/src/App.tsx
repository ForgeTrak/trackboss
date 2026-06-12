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
import { exchangeCode, refreshIdToken } from './controller/auth';
import MemberCommunicationsPage from './pages/MemberCommunicationsPage';
import ApplicationForm from './pages/ApplicationForm';
import RaceAdministration from './pages/RaceAdministration';
import EarlySeasonPage from './pages/EarlySeasonPage';
import AttendancePage from './pages/AttendancePage';
import { buildOAuthState } from './util/oauthState';
import CallbackPage from './pages/CallbackPage';

export function App() {
    const { state, update } = useContext(UserContext);
    const location = useLocation();

    // Helper function to redirect to login
    const redirectToLogin = useCallback(async () => {
        localStorage.removeItem('forgetrak_auth_token');
        localStorage.removeItem('forgetrak_refresh_token');
        update({
            loggedIn: false, token: '', refreshToken: '', user: undefined, storedUser: undefined, isInitializing: false,
        });
        const hostFirstPart = window.location.hostname.split('.')[0];
        const tenant = await getTenantBySlug(hostFirstPart);
        const encodedState = buildOAuthState({ tenant, origin: window.location.origin });
        // this is the only reasonable way to do this other than repeated string concatenation
        // eslint-disable-next-line max-len
        const authTarget = `${import.meta.env.VITE_AUTH_URL}/login?client_id=${import.meta.env.VITE_CLIENT_ID}&state=${encodedState}&response_type=code&scope=email+openid+phone&redirect_uri=${import.meta.env.VITE_CALLBACK_URL}`;
        window.location.href = authTarget;
    }, [update]);

    // Helper function to verify token and update state
    const updateState = useCallback(async (token: string, refreshToken?: string) => {
        // Set initializing to true while we verify the token
        update((prev) => ({ ...prev, isInitializing: true }));
        try {
            const user = await me(token);
            // Token is valid, set loggedIn to true and isInitializing to false.
            // Preserve any existing refresh token if a new one wasn't supplied.
            update((prev) => ({
                loggedIn: true,
                token,
                refreshToken: refreshToken ?? prev.refreshToken,
                user,
                storedUser: undefined,
                isInitializing: false,
            }));
        } catch (error: any) {
            // If the id token is invalid/expired, attempt a silent refresh with the
            // stored refresh token before falling back to a full re-login.
            if (error?.status === 401 || error?.status === 403) {
                const storedRefreshToken = refreshToken
                    || localStorage.getItem('forgetrak_refresh_token')
                    || '';
                if (storedRefreshToken) {
                    try {
                        const refreshed = await refreshIdToken(storedRefreshToken);
                        const user = await me(refreshed.idToken);
                        update({
                            loggedIn: true,
                            token: refreshed.idToken,
                            refreshToken: refreshed.refreshToken ?? storedRefreshToken,
                            user,
                            storedUser: undefined,
                            isInitializing: false,
                        });
                        return;
                    } catch {
                        // refresh failed - fall through to re-login
                    }
                }
                redirectToLogin();
            } else {
                // For other errors, also redirect to login to be safe
                redirectToLogin();
            }
        }
    }, [update, redirectToLogin]);

    // Exchange an authorization code (from the Cognito redirect) for tokens, then
    // verify the resulting id_token and clean the code out of the URL.
    const handleAuthCode = useCallback(async (code: string) => {
        update((prev) => ({ ...prev, isInitializing: true }));
        try {
            const { idToken, refreshToken } = await exchangeCode(code, import.meta.env.VITE_CALLBACK_URL);
            window.history.replaceState(null, '', window.location.pathname);
            await updateState(idToken, refreshToken);
        } catch (error: any) {
            // eslint-disable-next-line no-console
            console.error('Auth code exchange failed:', error?.status, error?.message, error);
            redirectToLogin();
        }
    }, [update, updateState, redirectToLogin]);

    // Effect to handle initial authentication and token validation
    useEffect(() => {
        const isPublicPage = location.pathname.includes('apply') || location.pathname.includes('callback');
        if (!state.loggedIn && state.isInitializing && !isPublicPage) {
            // First check if there's an authorization code in the URL (from Cognito redirect)
            const code = new URLSearchParams(location.search).get('code');
            if (code) {
                handleAuthCode(code);
            } else if (state.token) {
                // If no code but we have a stored token, try to verify it
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
        location.search,
        updateState,
        handleAuthCode,
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
                    // Token is invalid or expired - attempt a silent refresh before giving up
                    if (error?.status === 401 || error?.status === 403) {
                        if (state.refreshToken) {
                            try {
                                const refreshed = await refreshIdToken(state.refreshToken);
                                update((prev) => ({
                                    ...prev,
                                    token: refreshed.idToken,
                                    refreshToken: refreshed.refreshToken ?? prev.refreshToken,
                                }));
                                return;
                            } catch {
                                // refresh failed - fall through to re-login
                            }
                        }
                        redirectToLogin();
                    }
                }
            }, 5 * 60 * 1000); // Check every 5 minutes

            return () => clearInterval(validationInterval);
        }
    }, [state.loggedIn, state.token, state.refreshToken, location.pathname, update, redirectToLogin]);

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
            <Route path="attendance" element={<AttendancePage />} />
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
