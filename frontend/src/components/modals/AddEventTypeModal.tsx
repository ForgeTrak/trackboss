import React, { useState } from 'react';
import {
    Box,
    Button, Divider, Heading, Input,
} from '@chakra-ui/react';
import AppModal, { AppModalFooter } from '../AppModal';
import { PostNewEventTypeRequest } from '../../../../src/typedefs/eventType';
import { createEventType } from '../../controller/eventType';

interface alertProps {
    isOpen: boolean,
    token: string,
    userId: number,
    onClose: () => void,
    addAction: () => void,
}

export default function AddEventTypeModal(props: alertProps) {
    const [newEventType, setNewEventType] = useState<string>('');
    return (
        <AppModal isCentered size="md" isOpen={props.isOpen} onClose={props.onClose}>
            <Heading
                textAlign="center"
            >
                Add an event type
            </Heading>
            <Divider />
            <Box m={4}>
                <Input
                    placeholder="Event Type Name"
                    onChange={
                        (event) => {
                            setNewEventType(event.target.value);
                        }
                    }
                />
            </Box>
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
                        async () => {
                            const eventType: PostNewEventTypeRequest = {
                                modifiedBy: props.userId,
                                type: newEventType,
                            };
                            await createEventType(props.token, eventType);
                            props.addAction();
                            props.onClose();
                        }
                    }
                >
                    Save
                </Button>
            </AppModalFooter>
        </AppModal>
    );
}
