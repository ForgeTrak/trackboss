import React from 'react';
import { Dialog, Portal } from '@chakra-ui/react';

/**
 * Centralized modal component that wraps Chakra UI's Modal, ModalOverlay,
 * and ModalContent into a single component. This abstraction makes it easier
 * to upgrade Chakra UI versions since modal API changes only need to be
 * handled in one place.
 *
 * In Chakra UI v3, Modal becomes Dialog.Root, ModalOverlay is removed,
 * ModalContent becomes Dialog.Content, and sub-components are renamed.
 * Wrapping them here means we only update this one file during migration.
 *
 * Usage:
 *   <AppModal isOpen={isOpen} onClose={onClose} size="lg">
 *       <AppModalHeader>Title</AppModalHeader>
 *       <AppModalCloseButton />
 *       <AppModalBody>Content here</AppModalBody>
 *       <AppModalFooter>Footer buttons</AppModalFooter>
 *   </AppModal>
 */

type SpaceValue = string | number | undefined;

interface ContentStyleProps {
    padding?: SpaceValue;
    p?: SpaceValue;
    pb?: SpaceValue;
    pt?: SpaceValue;
    pl?: SpaceValue;
    pr?: SpaceValue;
    m?: SpaceValue;
    mb?: SpaceValue;
    mt?: SpaceValue;
    ml?: SpaceValue;
    mr?: SpaceValue;
}

interface AppModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    size?: string;
    closeOnOverlayClick?: boolean;
    contentProps?: ContentStyleProps;
}

export default function AppModal({
    isOpen,
    onClose,
    children,
    size,
    closeOnOverlayClick,
    contentProps,
}: AppModalProps) {
    return (
        <Dialog.Root
            open={isOpen}
            size={size}
            placement="center"
            closeOnInteractOutside={closeOnOverlayClick}
            onOpenChange={
                (e) => {
                    if (!e.open) {
                        onClose();
                    }
                }
            }
        >
            <Portal>

                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content
                        padding={contentProps?.padding}
                        p={contentProps?.p}
                        pb={contentProps?.pb}
                        pt={contentProps?.pt}
                        pl={contentProps?.pl}
                        pr={contentProps?.pr}
                        m={contentProps?.m}
                        mb={contentProps?.mb}
                        mt={contentProps?.mt}
                        ml={contentProps?.ml}
                        mr={contentProps?.mr}
                    >
                        {children}
                    </Dialog.Content>
                </Dialog.Positioner>

            </Portal>
        </Dialog.Root>
    );
}

AppModal.defaultProps = {
    size: undefined,
    closeOnOverlayClick: undefined,
    contentProps: undefined,
};

// Re-export sub-components so consumers import everything from one place.
// During Chakra v3 migration, only the mappings below need to change.
export const AppModalHeader = Dialog.Header;
export const AppModalBody = Dialog.Body;
export const AppModalFooter = Dialog.Footer;
export const AppModalCloseButton = Dialog.CloseTrigger;
