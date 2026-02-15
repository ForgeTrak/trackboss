import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../theme';

/**
 * Centralized provider component wrapping ChakraProvider with the app theme.
 * This abstraction makes it easier to upgrade Chakra UI versions since
 * provider API changes only need to be handled in one place.
 *
 * In Chakra UI v3, ChakraProvider changes to use a system/config pattern
 * instead of the v2 theme prop. Wrapping it here means we only update
 * this one file during migration.
 */

interface AppProviderProps {
    children: React.ReactNode;
}

export default function AppProvider({ children }: AppProviderProps) {
    return (
        <ChakraProvider theme={theme}>
            {children}
        </ChakraProvider>
    );
}
