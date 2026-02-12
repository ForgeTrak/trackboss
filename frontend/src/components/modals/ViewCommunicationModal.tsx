import React from 'react';
import {
    Button, Divider, Grid, GridItem, Heading, Input, Text,
} from '@chakra-ui/react';
import AppModal, { AppModalBody, AppModalFooter } from '../AppModal';
import { MemberCommunication } from '../../../../src/typedefs/memberCommunication';
import 'react-quill/dist/quill.snow.css';

interface ViewCommunicationModalProps {
    communication?: MemberCommunication,
    isOpen: boolean,
    onClose: () => void,
}

export default function ViewCommunicationModal(props: ViewCommunicationModalProps) {
    return (
        <AppModal isCentered size="xl" isOpen={props.isOpen} onClose={props.onClose}>
            <Heading
                textAlign="center"
            >
                Communication to PRA membership
            </Heading>
            <Divider />
            <AppModalBody>
                    <Grid columnGap={2} rowGap={2}>
                        <GridItem colSpan={2}>
                            <Text>Subject</Text>
                            <Input
                                size="md"
                                disabled
                                defaultValue={props.communication?.subject}
                            />
                        </GridItem>
                        <GridItem colSpan={2}>
                            <Text>Selected Tags</Text>
                            <Input
                                size="md"
                                disabled
                                defaultValue={props.communication?.selectedTags?.join(',')}
                            />
                        </GridItem>
                        <GridItem colSpan={2}>
                            <Text>Communication Type</Text>
                            <Input
                                size="md"
                                disabled
                                defaultValue={props.communication?.mechanism}
                            />
                        </GridItem>
                        <GridItem colSpan={2}>
                            <Text>Communication Content</Text>
                            <div
                                // eslint-disable-next-line react/no-danger
                                dangerouslySetInnerHTML={{ __html: props.communication?.text || '' }}
                            />
                        </GridItem>
                    </Grid>
                </AppModalBody>
                <AppModalFooter>
                    <Button backgroundColor="white" onClick={props.onClose}>
                        Close
                    </Button>
                </AppModalFooter>
        </AppModal>
    );
}
ViewCommunicationModal.defaultProps = {
    communication: {},
};
