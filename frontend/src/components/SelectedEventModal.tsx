/* eslint-disable max-len */
import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Button,
    Divider,
    Heading,
    SimpleGrid,
    VStack,
    Text,
    Switch,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionIcon,
    Box,
    AccordionPanel,
} from '@chakra-ui/react';
import AppModal, { AppModalBody, AppModalCloseButton, AppModalFooter } from './AppModal';
import moment from 'moment';
import { BsTrash2 } from 'react-icons/bs';
import DateTimePicker from 'react-datetime-picker';
import 'react-datetime-picker/dist/DateTimePicker.css';
import 'react-calendar/dist/Calendar.css';
import 'react-clock/dist/Clock.css';
import { getEventMonthDaySpan, getEventStartAndEndTime } from '../controller/utils';
import { UserContext } from '../contexts/UserContext';
import { PatchJobRequest } from '../../../src/typedefs/job';
import { updateEvent } from '../controller/event';
import { PatchEventRequest } from '../../../src/typedefs/event';
import WrappedSwitchInput from './input/WrappedSwitchInput';

interface modalProps {
  isOpen: boolean,
  onClose: () => void,
  selectedEvent: any,
  admin: boolean;
  deleteEvent: () => void;
  // eslint-disable-next-line no-unused-vars
  signUpForJob: (patchInfo: { jobId: number; editedJob: PatchJobRequest; }) => void;
  eventsRefresh: () => void;
}

export default function SelectedEventModal(props: modalProps) {
    const { state } = useContext(UserContext);
    // eslint-disable-next-line no-unused-vars
    const [enableDelete, setEnableDelete] = useState<boolean>(false);

    async function generateJobSignUpPatch() {
        let editedJob: PatchJobRequest;
        if ('jobId' in (props.selectedEvent) && state.user) {
            const { jobId } = props.selectedEvent;
            editedJob = {
                memberId: state.user.memberId,
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
    const [startDateTime, setStartDateTime] = useState<Date>(props.selectedEvent.start);
    const [endDateTime, setEndDateTime] = useState<Date>(props.selectedEvent.end);
    const [datesDirty, setDatesDirty] = useState<boolean>(false);
    const [restrictSignups] = useState<boolean>(props.selectedEvent.restrictSignups);

    return (
        <AppModal isCentered size="lg" isOpen={props.isOpen} onClose={props.onClose}>
            <Heading
                    textAlign="center"
                    pl={2}
                    pt={2}
                    color="orange.400"
                >
                    {getEventMonthDaySpan(props.selectedEvent.start.toString(), props.selectedEvent.end.toString())}
                </Heading>
            <AppModalBody>
                    <Text fontSize="2xl" textAlign="center">
                        {props.selectedEvent.title}
                    </Text>
                    <Text fontSize="xl" textAlign="center">
                        {
                            getEventStartAndEndTime(
                                props.selectedEvent.start.toString(),
                                props.selectedEvent.end.toString(),
                            )
                        }
                    </Text>
                    <Text fontSize="sm" textAlign="center">
                        {props.selectedEvent.eventDescription}
                    </Text>
                    {
                        ((props.admin) && (
                            <Accordion allowToggle>
                                <AccordionItem>
                                    <h2>
                                        <AccordionButton>
                                            <Box as="span">
                                                Edit Dates
                                            </Box>
                                            <AccordionIcon />
                                        </AccordionButton>
                                    </h2>
                                    <AccordionPanel>
                                        <SimpleGrid>
                                            <VStack align="left">
                                                <Text>Start Date/Time:</Text>
                                                <DateTimePicker
                                                    disableClock
                                                    disableCalendar
                                                    value={startDateTime}
                                                    onChange={
                                                        (date: any) => {
                                                            setStartDateTime(date);
                                                            setDatesDirty(true);
                                                        }
                                                    }
                                                />
                                            </VStack>
                                            <VStack align="left">
                                                <Text>End Date/Time:</Text>
                                                <DateTimePicker
                                                    disableClock
                                                    disableCalendar
                                                    value={endDateTime}
                                                    minDate={startDateTime}
                                                    onChange={
                                                        (date: any) => {
                                                            setEndDateTime(date);
                                                            setDatesDirty(true);
                                                        }
                                                    }
                                                />
                                            </VStack>
                                            <VStack align="left">
                                                <Button
                                                    width={50}
                                                    backgroundColor="orange.300"
                                                    color="white"
                                                    isDisabled={!datesDirty}
                                                    onClick={
                                                        async () => {
                                                            const patchEvent : PatchEventRequest = { restrictSignups: props.selectedEvent.restrictSignups };
                                                            patchEvent.startDate = moment(startDateTime).toISOString(true).slice(0, -10);
                                                            patchEvent.endDate = moment(endDateTime).toISOString(true).slice(0, -10);
                                                            patchEvent.eventDescription = props.selectedEvent.description;
                                                            patchEvent.eventName = props.selectedEvent.title;
                                                            patchEvent.restrictSignups = props.selectedEvent.restrictSignups;
                                                            await updateEvent(state.token, props.selectedEvent.eventId, patchEvent);
                                                            props.eventsRefresh();
                                                            props.onClose();
                                                        }
                                                    }
                                                >
                                                    Save
                                                </Button>
                                            </VStack>
                                        </SimpleGrid>
                                    </AccordionPanel>
                                </AccordionItem>
                            </Accordion>
                        ))
                    }
                    <WrappedSwitchInput
                        locked={!props.admin}
                        defaultChecked={props.selectedEvent.restrictSignups}
                        maxWidth={150}
                        wrapperText="Signups Restricted?"
                        onSwitchChange={
                            async () => {
                                const patchEvent : PatchEventRequest = { restrictSignups };
                                patchEvent.startDate = moment(startDateTime).toISOString(true).slice(0, -10);
                                patchEvent.endDate = moment(endDateTime).toISOString(true).slice(0, -10);
                                patchEvent.eventDescription = props.selectedEvent.description;
                                patchEvent.eventName = props.selectedEvent.title;
                                patchEvent.restrictSignups = !props.selectedEvent.restrictSignups;
                                await updateEvent(state.token, props.selectedEvent.eventId, patchEvent);
                                props.eventsRefresh();
                            }
                        }
                    />
                    <Text fontSize="x-small">
                        {`Event ID: ${props.selectedEvent.eventId}`}
                    </Text>
                </AppModalBody>
                <Divider />
                <AppModalCloseButton />
                <AppModalFooter>
                    <Link
                        to={`signups/${(moment(props.selectedEvent.start).toISOString()).split('T')[0]}/${props.selectedEvent.eventId}/${props.selectedEvent.eventType}`}
                        state={{ date: props.selectedEvent.start }}
                    >
                        View Sign Ups
                    </Link>
                    {
                        props.admin && (
                            <>
                                <Button
                                    ml={3}
                                    mr={3}
                                    backgroundColor="red"
                                    color="white"
                                    isDisabled={!enableDelete}
                                    rightIcon={<BsTrash2 />}
                                    onClick={
                                        () => {
                                            props.deleteEvent();
                                            props.onClose();
                                        }
                                    }
                                >
                                    Delete
                                </Button>
                                <Switch
                                    size="sm"
                                    colorScheme="orange"
                                    onChange={
                                        (event) => {
                                            setEnableDelete(event.currentTarget.checked);
                                        }
                                    }
                                />
                            </>
                        )
                    }
                    {
                        // Don't display the sign up button if the job already has a member
                        'jobId' in props.selectedEvent && !props.selectedEvent.member && (
                            <Button
                                bgColor="orange"
                                color="white"
                                onClick={
                                    async () => {
                                        const signUpPatch = await generateJobSignUpPatch();
                                        if (signUpPatch) {
                                            props.signUpForJob(signUpPatch);
                                        }
                                        props.onClose();
                                    }
                                }
                            >
                                Sign Up
                            </Button>
                        )
                    }
                </AppModalFooter>
        </AppModal>
    );
}
