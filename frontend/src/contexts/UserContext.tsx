import React, { createContext, useCallback } from 'react';
import { Member } from '../../../src/typedefs/member';

interface UserContextInterface {
    loggedIn: boolean,
    token: string,
    user: Member | undefined,
    storedUser: Member | undefined,
}

const TOKEN_STORAGE_KEY = 'trackboss_auth_token';

export const initialUserContext: UserContextInterface = {
    loggedIn: false,
    token: '',
    user: undefined,
    storedUser: undefined,
};

// Initialize state from localStorage if token exists
const getInitialState = (): UserContextInterface => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedToken) {
        return {
            ...initialUserContext,
            token: storedToken,
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
            // Persist token to localStorage when logged in
            if (updatedState.loggedIn && updatedState.token) {
                localStorage.setItem(TOKEN_STORAGE_KEY, updatedState.token);
            } else if (!updatedState.loggedIn) {
                // Remove token from localStorage when logged out
                localStorage.removeItem(TOKEN_STORAGE_KEY);
            }
            return updatedState;
        });
    }, []);

    // this disable is necessary to allow this to render correctly
    // eslint-disable-next-line
    return <UserContext.Provider value={{ state, update }} {...props} />;
}
