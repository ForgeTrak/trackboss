import React, { useContext } from 'react';

import {
    Button, NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField,
    NumberInputStepper, SimpleGrid,
} from '@chakra-ui/react';
import AppModal, { AppModalBody, AppModalCloseButton, AppModalFooter, AppModalHeader } from '../AppModal';
import { useAppToast } from '../../hooks/useAppToast';
import { Job } from '../../../../src/typedefs/job';
import { modifyJobPoints, removeSignup } from '../../controller/job';
import { UserContext } from '../../contexts/UserContext';

interface EditPointsModalProps {
    memberName: string,
    selectedJob: Job,
    refreshPoints: Function,
    isOpen: boolean,
    onClose: () => void,
}

export default function ExportPointsModal(props: EditPointsModalProps) {
    const { selectedJob } = props;
    const { state } = useContext(UserContext);
    const toast = useAppToast();

    return (
        <AppModal closeOnOverlayClick={false} isOpen={props.isOpen} onClose={props.onClose}>
            <AppModalHeader>{`Edit points for ${props.memberName} - ${selectedJob.title}`}</AppModalHeader>
            <AppModalCloseButton />
            <AppModalBody pb={6}>
                    <SimpleGrid columns={2}>
                        <NumberInput
                            min={0}
                            max={30}
                            defaultValue={props.selectedJob.pointsAwarded}
                            step={0.25}
                            onChange={
                                async (changeValue) => {
                                    // eslint-disable-next-line max-len
                                    await modifyJobPoints(state.token, selectedJob.jobId, parseFloat(changeValue) || 0);
                                    props.refreshPoints();
                                    toast.success({
                                        title: 'Points updated!',
                                        description: `${selectedJob.member} ${selectedJob.title}, ${changeValue}`,
                                    });
                                }
                            }
                        >
                            <NumberInputField
                                placeholder="Points earned"
                            />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                    </SimpleGrid>
                </AppModalBody>

                <AppModalFooter>
                    <Button
                        onClick={props.onClose}
                        backgroundColor="orange"
                        color="white"
                        mr={3}
                    >
                        Save
                    </Button>
                    <Button
                        onClick={
                            async () => {
                                await removeSignup(state.token, selectedJob?.jobId || 0);
                                props.refreshPoints();
                                toast.error({
                                    title: 'Entry removed',
                                    description: `${selectedJob?.member} ${selectedJob?.title}, ${selectedJob?.jobId}`,
                                });
                                props.onClose();
                            }
                        }
                        backgroundColor="red"
                        color="white"
                        mr={3}
                    >
                        Delete
                    </Button>
                    <Button onClick={props.onClose} backgroundColor="white">Cancel</Button>
                </AppModalFooter>
        </AppModal>
    );
}
