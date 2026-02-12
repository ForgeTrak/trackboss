import React, { useState } from 'react';
import {
    Box, Button, Divider, Heading, Input,
    NumberInput, NumberInputField, SimpleGrid, Text,
} from '@chakra-ui/react';
import AppModal, { AppModalFooter } from '../AppModal';
import { useAppToast } from '../../hooks/useAppToast';
import { createEventJob } from '../../controller/eventJob';
import { createJobType } from '../../controller/jobType';
import { JobType, PostNewJobTypeRequest } from '../../../../src/typedefs/jobType';
import DaysOfWeekSelect from '../input/DaysOfWeekSelect';
import WrappedSwitchInput from '../input/WrappedSwitchInput';

interface alertProps {
    eventType: string,
    eventTypeId: number,
    isOpen: boolean,
    token: string,
    userId: number,
    onClose: () => void,
    addAction: () => void,
}

export default function AddJobTypeModal(props: alertProps) {
    const [description, setDescription] = useState<string>();
    const [pointValue, setPointValue] = useState<number>();
    const [cashValue, setCashValue] = useState<number>(0);
    // default job day Number to Sunday, which is easier for input since that's the most common day.
    const [jobDayNumber, setJobDayNumber] = useState<number>(6);
    const [mealTicketValue, setMealTicketValue] = useState<boolean>(false);
    const [count, setCount] = useState<number>(1);
    const [sortOrder, setSortOrder] = useState<number>(99);
    const toast = useAppToast();
    return (
        <AppModal isCentered size="md" isOpen={props.isOpen} onClose={props.onClose}>
            <Heading
                textAlign="center"
            >
                Add a &nbsp;
                {props.eventType}
                    &nbsp; job
            </Heading>
            <Divider />
            <SimpleGrid columns={[2, 3, 3]} spacing={2} m={3}>
                <Box maxWidth={250}>
                    <Text fontSize="sm">Description</Text>
                    <Input
                        onChange={
                            (event) => {
                                setDescription(event.target.value);
                            }
                        }
                    />
                </Box>
                <Box maxWidth={100}>
                    <Text fontSize="sm">Point Value</Text>
                    <NumberInput min={0} max={30} step={0.25}>
                        <NumberInputField
                            onChange={
                                (event) => {
                                    setPointValue(parseFloat(event.target.value));
                                }
                            }
                        />
                    </NumberInput>
                </Box>
                <Box maxWidth={100}>
                    <Text fontSize="sm">Cash Payout</Text>
                    <NumberInput min={0} max={750} step={10} defaultValue={cashValue}>
                        <NumberInputField
                            onChange={
                                (event) => {
                                    setCashValue(parseFloat(event.target.value));
                                }
                            }
                        />
                    </NumberInput>
                </Box>
                <Box maxWidth={140}>
                    <Text fontSize="sm">Job Day</Text>
                    <DaysOfWeekSelect
                        defaultDay={6}
                        onDayChange={setJobDayNumber}
                    />
                </Box>
                <WrappedSwitchInput
                    wrapperText="Meal Ticket?"
                    defaultChecked={mealTicketValue}
                    onSwitchChange={setMealTicketValue}
                    maxWidth={100}
                />
                <Box maxWidth={100}>
                    <Text fontSize="sm">Positions</Text>
                    <NumberInput min={1} max={300} step={1} defaultValue={count}>
                        <NumberInputField
                            onChange={
                                (event) => {
                                    setCount(parseInt(event.target.value, 10));
                                }
                            }
                        />
                    </NumberInput>
                </Box>
                <Box maxWidth={100}>
                    <Text fontSize="sm">Display Order</Text>
                    <NumberInput min={1} max={300} step={1} defaultValue={sortOrder}>
                        <NumberInputField
                            onChange={
                                (event) => {
                                    setSortOrder(parseInt(event.target.value, 10));
                                }
                            }
                        />
                    </NumberInput>
                    <Text fontSize="xs">(default is 99, bottom of the list for the day)</Text>
                </Box>
            </SimpleGrid>
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
                            // First, create the job type.
                            const uiJobType : PostNewJobTypeRequest = {
                                title: description as string,
                                cashValue,
                                pointValue,
                                sortOrder,
                                online: true,
                                reserved: false,
                                jobDayNumber,
                                mealTicket: mealTicketValue,
                                modifiedBy: props.userId,
                            };
                            const newJobType = await createJobType(props.token, uiJobType) as JobType;
                            // now, associate the job type to the event type
                            const newEventJob = await createEventJob(props.token, {
                                eventTypeId: props.eventTypeId,
                                jobTypeId: newJobType.jobTypeId,
                                count,
                            });
                            toast.success({
                                title: `${newJobType.title} added. (job Type id ${newJobType.jobTypeId}`,
                                description: JSON.stringify(newEventJob),
                            });
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
