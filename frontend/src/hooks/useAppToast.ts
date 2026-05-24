/* eslint-disable no-unused-vars */
import { useCallback } from 'react';
import { toaster } from '../components/ui/toaster';

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
    const success = useCallback((options: ToastOptions) => {
        toaster.success({
            title: options.title,
            description: options.description,
            duration: options.duration ?? DEFAULT_DURATION,
            closable: options.isClosable ?? true,
        });
    }, []);

    const error = useCallback((options: ToastOptions) => {
        toaster.error({
            title: options.title,
            description: options.description,
            duration: options.duration ?? DEFAULT_DURATION,
            closable: options.isClosable ?? true,
        });
    }, []);

    const info = useCallback((options: ToastOptions) => {
        toaster.info({
            title: options.title,
            description: options.description,
            duration: options.duration ?? DEFAULT_DURATION,
            closable: options.isClosable ?? true,
        });
    }, []);

    const warning = useCallback((options: ToastOptions) => {
        toaster.warning({
            title: options.title,
            description: options.description,
            duration: options.duration ?? DEFAULT_DURATION,
            closable: options.isClosable ?? true,
        });
    }, []);

    return {
        success,
        error,
        info,
        warning,
    };
}

export default useAppToast;
