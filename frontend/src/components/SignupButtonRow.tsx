import {
    Button, ButtonGroup, SimpleGrid,
} from '@chakra-ui/react';
import React, { useContext, useEffect, useState } from 'react';
import { BsCurrencyDollar, BsTrash2 } from 'react-icons/bs';
import moment from 'moment-timezone';
import AppModal, { AppModalBody, AppModalCloseButton, AppModalFooter, AppModalHeader } from './AppModal';

import { useAppDisclosure } from '../hooks/useAppDisclosure';
import { signupForJob, removeSignup, setPaidState } from '../controller/job';
import { UserContext } from '../contexts/UserContext';
import MemberSelector from './shared/MemberSelector';
import EditPointsModal from './modals/EditPointsModal';
import PaidLaborSelector from './shared/PaidLaborSelector';

export default function SignupButtonRow(props: any) {
    const { state } = useContext(UserContext);
    const [selectedOption, setSelectedOption] = useState<any>();
    const [selectedPaidLaborOption, setSelectedPaidLaborOption] = useState<any>();
    const [markedPaid, setMarkedPaid] = useState<boolean>(props.data.paid);

    const [jobMembershipId] = useState(props.data.membershipId);

    const {
        isOpen: isNonMemberOpen,
        onOpen: onNonMemberOpen,
        onClose: onNonMemberClose,
    } = useAppDisclosure();

    const {
        isOpen: isEditPointsOpen,
        onOpen: onEditPointsOpen,
        onClose: onEditPointsClose,
    } = useAppDisclosure();

    const [jobId] = useState(props.data.jobId);

    const isAdmin = state.user?.memberType === 'Admin';

    const selfSignupAllowed = ((props.eventType.toLowerCase() !== 'meeting') &&
        (props.eventType.toLowerCase() !== 'work day') &&
        !props.restrictSignups
    );

    const startEastern = moment(props.data.start, 'YYYY-MM-DD HH:mm:ss').tz('America/New_York', true);
    const disableForMembers = startEastern.isBefore(moment());

    useEffect(() => {
        async function signupForJobDropdown() {
            await signupForJob(state.token, props.data.jobId, selectedOption.value);
            props.refreshData();
        }
        signupForJobDropdown();
    }, [selectedOption]);

    useEffect(() => {
        async function signupLaborForJobDropdown() {
            props.refreshData();
        }
        signupLaborForJobDropdown();
    }, [selectedPaidLaborOption]);

    let signupButton;
    if (!props.data.member) {
        signupButton = (
            <SimpleGrid columns={[1, null, 3]} spacing="20px">
                {
                    (!isAdmin && selfSignupAllowed) && (

                        <MemberSelector
                            isAdmin={false}
                            disabled={disableForMembers}
                            setSelectedOption={setSelectedOption}
                        />
                    )
                }
                {
                    isAdmin && (
                        <>
                            <MemberSelector
                                isAdmin
                                disabled={disableForMembers}
                                setSelectedOption={setSelectedOption}
                            />
                            <Button
                                backgroundColor="orange.300"
                                color="white"
                                maxWidth={200}
                                onClick={onNonMemberOpen}
                            >
                                Sign Up Non Member
                            </Button>
                        </>
                    )
                }
                <AppModal isOpen={isNonMemberOpen} onClose={onNonMemberClose}>
                    <AppModalHeader>Add Non Member</AppModalHeader>
                    <AppModalCloseButton />
                    <AppModalBody>
                        You can use this window to add a non member to a job.  Adding a member this way
                        will cause their points to not be counted for this job, so please use the Member dropdown
                        for that.  You can either select a name here, or type a new one (FirstName LastName).
                        and then select it.  These are editable and contact info can be added on the Paid Labor tab.
                        <PaidLaborSelector
                            isAdmin
                            disabled={false}
                            setSelectedOption={setSelectedPaidLaborOption}
                        />
                    </AppModalBody>

                    <AppModalFooter>
                        <Button
                            backgroundColor="orange.300"
                            color="white"
                            onClick={
                                async () => {
                                    // eslint-disable-next-line max-len
                                    await signupForJob(state.token, props.data.jobId, selectedPaidLaborOption.value, true);
                                    // await signupForJobFreeForm(state.token, props.data.jobId, paidLabor);
                                    await props.refreshData();
                                    setMarkedPaid(true);
                                    onNonMemberClose();
                                }
                            }
                        >
                            Save
                        </Button>
                        <Button ml={3} color="white" onClick={onNonMemberClose}>
                            Close
                        </Button>
                    </AppModalFooter>
                </AppModal>
            </SimpleGrid>
        );
    } else {
        // I can delete my own signups, and of course admins can delete everyone's signups.
        const allowDelete = (
            (state?.user?.membershipId === jobMembershipId) ||
            (isAdmin)
        );
        signupButton = (
            <ButtonGroup variant="outline" ml={10} spacing="6">
                <Button
                    aria-label="Remove"
                    background="red"
                    color="white"
                    rightIcon={<BsTrash2 />}
                    onClick={
                        async () => {
                            await removeSignup(state.token, jobId);
                            await props.refreshData();
                        }
                    }
                    isDisabled={!allowDelete}
                >
                    Remove Signup
                </Button>
                <Button
                    background={markedPaid ? 'orange.300' : 'green'}
                    color="white"
                    rightIcon={<BsCurrencyDollar />}
                    onClick={
                        async () => {
                            await setPaidState(state.token, jobId);
                            setMarkedPaid(!markedPaid);
                            await props.refreshData();
                        }
                    }
                    isDisabled={!props.data.cashPayout}
                    hidden={(!selfSignupAllowed || !isAdmin)}
                >
                    {markedPaid ? 'Unmark paid' : 'Mark as Paid'}
                </Button>
                <Button
                    background="orange.300"
                    color="white"
                    style={{ visibility: state.user?.memberType === 'Admin' ? 'visible' : 'hidden' }}
                    onClick={
                        async () => {
                            onEditPointsOpen();
                            await props.refreshData();
                        }
                    }
                >
                    Edit Points
                </Button>
                <EditPointsModal
                    memberName={props.data.member}
                    selectedJob={props.data}
                    refreshPoints={props.refreshData}
                    isOpen={isEditPointsOpen}
                    onClose={onEditPointsClose}
                />
            </ButtonGroup>
        );
    }
    return signupButton;
}
