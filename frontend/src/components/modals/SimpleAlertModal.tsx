import React from 'react';
import { Button } from '@chakra-ui/react';
import AppModal, { AppModalBody, AppModalCloseButton, AppModalFooter, AppModalHeader } from '../AppModal';

interface SimpleAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: string | undefined;
    title: string,
}

export default function SimpleAlertModal(props: SimpleAlertModalProps) {
    return (
        <AppModal isOpen={props.isOpen} onClose={props.onClose}>
            <AppModalHeader>{props.title}</AppModalHeader>
            <AppModalCloseButton />
            <AppModalBody>
                {props.message}
            </AppModalBody>
            <AppModalFooter>
                <Button backgroundColor="orange" color="white" mr={3} onClick={props.onClose}>
                    Close
                </Button>
            </AppModalFooter>
        </AppModal>
    );
}
