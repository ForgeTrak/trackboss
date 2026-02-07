/* eslint-disable no-unused-vars */
import { useDisclosure } from '@chakra-ui/react';

/**
 * Centralized disclosure hook for consistent open/close state management across the app.
 * This abstraction makes it easier to upgrade Chakra UI versions since
 * the disclosure API changes only need to be handled in one place.
 *
 * In Chakra UI v3, component props like isOpen become "open", and the useDisclosure
 * hook API may change. Wrapping it here means we only update one file during migration.
 */

interface AppDisclosureOptions {
    defaultIsOpen?: boolean;
    onOpen?: () => void;
    onClose?: () => void;
}

interface AppDisclosure {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    onToggle: () => void;
}

export function useAppDisclosure(options?: AppDisclosureOptions): AppDisclosure {
    const { isOpen, onOpen, onClose, onToggle } = useDisclosure({
        defaultIsOpen: options?.defaultIsOpen,
        onOpen: options?.onOpen,
        onClose: options?.onClose,
    });

    return {
        isOpen,
        onOpen,
        onClose,
        onToggle,
    };
}

export default useAppDisclosure;
