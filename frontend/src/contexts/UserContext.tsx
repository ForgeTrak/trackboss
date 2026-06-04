import React, { createContext, useCallback } from 'react';
import { Member } from '../../../src/typedefs/member';

interface UserContextInterface {
    loggedIn: boolean,
    token: string,
    // optional so existing call sites that build this object without a refresh
    // token (e.g. Header, MemberSummaryModal, tests) continue to type-check
    refreshToken?: string,
    user: Member | undefined,
    storedUser: Member | undefined,
    isInitializing: boolean,
}

const TOKEN_STORAGE_KEY = 'forgetrak_auth_token';
const REFRESH_TOKEN_STORAGE_KEY = 'forgetrak_refresh_token';

export const initialUserContext: UserContextInterface = {
    loggedIn: false,
    token: '',
    refreshToken: '',
    user: undefined,
    storedUser: undefined,
    isInitializing: true,
};

// Initialize state from localStorage if token exists
const getInitialState = (): UserContextInterface => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    if (storedToken || storedRefreshToken) {
        return {
            ...initialUserContext,
            token: storedToken || '',
            refreshToken: storedRefreshToken || '',
            isInitializing: true,
            // Note: loggedIn will be set to true after token is verified in App.tsx
        };
    }
    return initialUserContext;
};

type UpdateType = React.Dispatch<
    React.SetStateAction<UserContextInterface>
>;
const defaultUpdate: UpdateType = () => initialUserContext;

export const UserContext = createContext({
    state: initialUserContext,
    update: defaultUpdate,
});

export function UserContextProvider(props: React.PropsWithChildren<{}>) {
    const [state, setState] = React.useState(getInitialState);

    // Custom update function that also persists token to localStorage
    const update = useCallback((newState: UserContextInterface |
        // eslint-disable-next-line no-unused-vars
        ((prev: UserContextInterface) => UserContextInterface)) => {
        setState((prevState) => {
            const updatedState = typeof newState === 'function' ? newState(prevState) : newState;
            // Persist tokens to localStorage when logged in
            if (updatedState.loggedIn && updatedState.token) {
                localStorage.setItem(TOKEN_STORAGE_KEY, updatedState.token);
                if (updatedState.refreshToken) {
                    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, updatedState.refreshToken);
                }
            } else if (!updatedState.loggedIn) {
                // Remove tokens from localStorage when logged out
                localStorage.removeItem(TOKEN_STORAGE_KEY);
                localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
            }
            return updatedState;
        });
    }, []);

    // this disable is necessary to allow this to render correctly
    // eslint-disable-next-line
    return <UserContext.Provider value={{ state, update }} {...props} />;
}
