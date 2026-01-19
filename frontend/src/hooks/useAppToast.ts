/* eslint-disable no-unused-vars */
import { useToast } from '@chakra-ui/react';
import { useCallback } from 'react';

/**
 * Centralized toast hook for consistent toast notifications across the app.
 * This abstraction makes it easier to upgrade Chakra UI versions since
 * toast API changes only need to be handled in one place.
 */

interface ToastOptions {
    title?: string;
    description?: string;
    duration?: number;
    isClosable?: boolean;
}

interface AppToast {
    success: (options: ToastOptions) => void;
    error: (options: ToastOptions) => void;
    info: (options: ToastOptions) => void;
    warning: (options: ToastOptions) => void;
}

const DEFAULT_DURATION = 5000;

export function useAppToast(): AppToast {
    const toast = useToast();

    const success = useCallback((options: ToastOptions) => {
        toast({
            containerStyle: {
                background: 'orange',
            },
            title: options.title,
            description: options.description,
            status: 'success',
            duration: options.duration ?? DEFAULT_DURATION,
            isClosable: options.isClosable ?? true,
        });
    }, [toast]);

    const error = useCallback((options: ToastOptions) => {
        toast({
            containerStyle: {
                background: 'red',
            },
            title: options.title,
            description: options.description,
            status: 'error',
            duration: options.duration ?? DEFAULT_DURATION,
            isClosable: options.isClosable ?? true,
        });
    }, [toast]);

    const info = useCallback((options: ToastOptions) => {
        toast({
            containerStyle: {
                background: 'blue',
            },
            title: options.title,
            description: options.description,
            status: 'info',
            duration: options.duration ?? DEFAULT_DURATION,
            isClosable: options.isClosable ?? true,
        });
    }, [toast]);

    const warning = useCallback((options: ToastOptions) => {
        toast({
            containerStyle: {
                background: 'yellow',
            },
            title: options.title,
            description: options.description,
            status: 'warning',
            duration: options.duration ?? DEFAULT_DURATION,
            isClosable: options.isClosable ?? true,
        });
    }, [toast]);

    return {
        success,
        error,
        info,
        warning,
    };
}

export default useAppToast;
