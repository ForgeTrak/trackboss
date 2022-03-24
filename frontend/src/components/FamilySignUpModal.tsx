// import React, { useEffect, useState } from 'react';
import React, { useContext } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalCloseButton,
    Button,
    Divider,
    Heading,
    ModalFooter,
    SimpleGrid,

} from '@chakra-ui/react';
import moment from 'moment';
import { Member } from '../../../src/typedefs/member';
import { Job, PatchJobRequest } from '../../../src/typedefs/job';
import { UserContext } from '../contexts/UserContext';

interface modalProps {
  isOpen: boolean,
  onClose: () => void,
  familyMembers: Member[],
  selectedEvent: any, // TODO: bugfix needed, Event | Job breaks here
  // eslint-disable-next-line no-unused-vars
  signUpForJob: (patchInfo: { jobId: number; editedJob: PatchJobRequest; }) => void
}

export default function FamilySignUpModal(props: modalProps) {
    const { state } = useContext(UserContext);

    function isJob(selectedEvent: Event | Job): selectedEvent is Job {
        if ((selectedEvent as Job).jobId) {
            return true;
        }
        // else, its an Event
        return false;
    }

    async function generateJobSignUpPatch(memberId: number) {
        let editedJob: PatchJobRequest;
        if (isJob(props.selectedEvent) && memberId && state.user) {
            const { jobId } = props.selectedEvent;
            editedJob = {
                memberId,
                eventId: props.selectedEvent.eventId,
                jobTypeId: undefined,
                jobStartDate: moment(props.selectedEvent.start).toISOString(true).slice(0, -10),
                jobEndDate: moment(props.selectedEvent.end).toISOString(true).slice(0, -10),
                pointsAwarded: props.selectedEvent.pointsAwarded,
                verified: props.selectedEvent.verified,
                paid: props.selectedEvent.paid,
                modifiedBy: state.user.memberId,
            };
            return { jobId, editedJob };
        }
        return undefined;
    }

    return (
        <Modal isCentered size="xl" isOpen={props.isOpen} onClose={props.onClose}>
            <ModalOverlay />
            <ModalContent>
                <Heading pl={2} pr={2} textAlign="left">Select member to sign up</Heading>
                <Divider mb={5} />
                <ModalCloseButton />
                <SimpleGrid spacing={2} columns={3}>
                    {
                        props.familyMembers.map((member) => (
                            <Button
                                key={member.memberId}
                                onClick={
                                    async () => {
                                        const signUpPatch = await generateJobSignUpPatch(member.memberId);
                                        if (signUpPatch) {
                                            props.signUpForJob(signUpPatch);
                                        }
                                        props.onClose();
                                    }
                                }
                                m={3}
                                _hover={{ bg: 'orange.100' }}
                            >
                                {`${member.firstName} ${member.lastName}`}
                            </Button>
                        ))
                    }
                </SimpleGrid>
                <Divider />
                <ModalFooter>
                    <Button
                        variant="ghost"
                        mr={3}
                        size="sm"
                        onClick={
                            () => {
                                props.onClose();
                            }
                        }
                    >
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
