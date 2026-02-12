import React from 'react';
import {
    Button,
    Divider,
    Heading,
    Text,
} from '@chakra-ui/react';
import AppModal, { AppModalFooter } from './AppModal';

interface alertProps {
  isOpen: boolean,
  onClose: () => void,
  removeMethod: () => void,
}

export default function DeleteAlert(props: alertProps) {
    return (
        <AppModal isCentered size="md" isOpen={props.isOpen} onClose={props.onClose}>
            <Heading
                textAlign="center"
            >
                Are you sure?
            </Heading>
            <Text textAlign="center" fontSize="2xl">You can&apos;t undo this action afterwards.</Text>
            <Divider />
            <AppModalFooter>
                <Button
                    variant="ghost"
                    mr={3}
                    size="lg"
                    onClick={
                        () => {
                            props.onClose();
                        }
                    }
                >
                    Cancel
                </Button>
                <Button
                    color="red"
                    variant="ghost"
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
            </AppModalFooter>
        </AppModal>
    );
}
