import React from 'react';
import { Button, Text } from '@chakra-ui/react';
import AppModal, { AppModalBody, AppModalCloseButton, AppModalFooter, AppModalHeader } from '../AppModal';

interface DeleteAlertProps {
    isOpen: boolean,
    onClose: () => void,
    removeMethod: () => void,
}

export default function DeleteAlert(props: DeleteAlertProps) {
    return (
        <AppModal size="md" isOpen={props.isOpen} onClose={props.onClose}>
            <AppModalCloseButton />
            <AppModalHeader>Are you sure?</AppModalHeader>
            <AppModalBody>
                <Text fontSize="lg" textAlign="center">
                    You can&apos;t undo this action afterwards.
                </Text>
            </AppModalBody>
            <AppModalFooter>
                <Button
                    backgroundColor="red.500"
                    color="white"
                    mr={3}
                    size="lg"
                    onClick={
                        () => {
                            props.removeMethod();
                            props.onClose();
                        }
                    }
                >
                    Delete
                </Button>
                <Button variant="outline" size="lg" onClick={props.onClose}>
                    Cancel
                </Button>
            </AppModalFooter>
        </AppModal>
    );
}
