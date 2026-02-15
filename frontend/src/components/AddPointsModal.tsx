import React, { useState } from 'react';
import {
    Button,
    IconButton, Input, NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField,
    NumberInputStepper, VStack,
} from '@chakra-ui/react';
import { BsPlus } from 'react-icons/bs';
import moment from 'moment';
import DatePicker from 'react-date-picker';
import AppModal, { AppModalBody, AppModalCloseButton, AppModalFooter, AppModalHeader } from './AppModal';
import { useAppToast } from '../hooks/useAppToast';
import { useAppDisclosure } from '../hooks/useAppDisclosure';
import { createJobType } from '../controller/jobType';
import { JobType, PostNewJobTypeRequest } from '../../../src/typedefs/jobType';
import { Job, PostNewJobRequest } from '../../../src/typedefs/job';
import { createJob } from '../controller/job';
import MemberSelector from './shared/MemberSelector';

interface AddPointsModalProps {
    memberName: string,
    memberId: number,
    membershipId: number,
    visible: boolean,
    refreshPoints: Function,
    token: string,
    buttonText?: string,
}
export default function AddPointsModal(props: AddPointsModalProps) {
    const {
        isOpen,
        onOpen,
        onClose,
    } = useAppDisclosure();
    const [description, setDescription] = useState<string>('');
    const [pointValue, setPointValue] = useState<number>(0);
    const [dirty, setDirty] = useState<boolean>(false);
    const [workDate, setWorkDate] = useState<any>(new Date());
    const [selectedOption, setSelectedOption] = useState<any>();
    const toast = useAppToast();
    let addButton =
        (
            <IconButton
                aria-label="add"
                icon={<BsPlus />}
                background="orange"
                color="white"
                hidden={!props.visible}
                onClick={onOpen}
            />
        );
    // if the button text is passed in, use a text button instead of the default Plus icon.
    if (props.buttonText) {
        addButton =
            (
                <Button
                    variant="outline"
                    style={
                        {
                            whiteSpace: 'normal',
                            wordWrap: 'break-word',
                        }
                    }
                    isDisabled={!props.visible}
                    onClick={onOpen}
                >
                    {props.buttonText}
                </Button>
            );
    }
    return (
        <>
            {addButton}
            <AppModal isOpen={isOpen} onClose={onClose}>
                <AppModalHeader>{`Add Points to ${props.memberName}`}</AppModalHeader>
                <AppModalCloseButton />
                <AppModalBody>
                    <VStack>
                        <MemberSelector
                            isAdmin={false}
                            membershipId={props.membershipId}
                            setSelectedOption={setSelectedOption}
                            disabled={false}
                        />
                        <Input
                            placeholder="Description of work performed"
                            value={description}
                            size="md"
                            onChange={
                                (e) => {
                                    setDescription(e.target.value);
                                    setDirty(true);
                                }
                            }
                        />
                        <NumberInput
                            min={0}
                            max={30}
                            defaultValue={0}
                            step={0.25}
                            onChange={
                                (changeValue) => {
                                    setPointValue(Number(changeValue));
                                    setDirty(true);
                                }
                            }
                        >
                            <NumberInputField
                                placeholder="Points earned"
                                value={pointValue}
                                onChange={
                                    (e) => {
                                        setPointValue(Number(e.target.value));
                                        setDirty(true);
                                    }
                                }
                            />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                        <DatePicker
                            onChange={setWorkDate}
                            value={workDate}
                            required
                            maxDate={new Date()}
                        />
                    </VStack>
                </AppModalBody>

                <AppModalFooter>
                    <Button
                        mr={4}
                        backgroundColor="orange"
                        isDisabled={!dirty}
                        color="white"
                        onClick={
                            async () => {
                                const createJobTypeRequest : PostNewJobTypeRequest = {
                                    title: description,
                                    pointValue,
                                    cashValue: 0,
                                    reserved: false,
                                    online: true,
                                    mealTicket: false,
                                    modifiedBy: props.memberId,
                                };
                                const createdJobType : JobType =
                                        await createJobType(props.token, createJobTypeRequest) as JobType;
                                const workDateFormatted = moment(workDate).format('YYYY-MM-DD HH:mm');
                                const createJobRequest : PostNewJobRequest = {
                                    jobTypeId: createdJobType.jobTypeId,
                                    memberId: selectedOption.value,
                                    membershipId: props.membershipId,
                                    jobStartDate: workDateFormatted,
                                    jobEndDate: workDateFormatted,
                                    pointsAwarded: createdJobType.pointValue,
                                    cashPayout: 0,
                                    verified: true,
                                    paid: false,
                                    verifiedDate: workDateFormatted,
                                    modifiedBy: props.memberId,
                                };
                                const createdJob : Job =
                                        await createJob(props.token, createJobRequest) as Job;
                                props.refreshPoints();
                                setPointValue(0);
                                setDescription('');
                                onClose();
                                toast.success({
                                    title: 'Points entry created!',
                                    description: `${JSON.stringify(createdJob)}`,
                                });
                            }
                        }
                    >
                        Save
                    </Button>
                    <Button backgroundColor="white" onClick={onClose}>
                        Close
                    </Button>
                </AppModalFooter>
            </AppModal>
        </>
    );
}
AddPointsModal.defaultProps = {
    buttonText: '',
};
