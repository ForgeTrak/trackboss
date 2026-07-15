/* eslint-disable max-len */
import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Button,
    Heading,
    SimpleGrid,
    VStack,
    Text,
    Switch,
    Accordion,
    Box,
    Separator,
} from '@chakra-ui/react';
import moment from 'moment';
import { BsTrash2 } from 'react-icons/bs';
import AppModal, { AppModalBody, AppModalCloseButton, AppModalFooter } from './AppModal';
import AppDateTimePicker from './input/AppDateTimePicker';
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
        <AppModal size="lg" isOpen={props.isOpen} onClose={props.onClose}>
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
                        <Accordion.Root collapsible>
                            <Accordion.Item value="item-0">
                                <h2>
                                    <Accordion.ItemTrigger>
                                        <Box as="span">
                                            Edit Dates
                                        </Box>
                                        <Accordion.ItemIndicator />
                                    </Accordion.ItemTrigger>
                                </h2>
                                <Accordion.ItemContent>
                                    <Accordion.ItemBody>
                                        <SimpleGrid>
                                            <VStack align="left">
                                                <Text>Start Date/Time:</Text>
                                                <AppDateTimePicker
                                                    value={startDateTime}
                                                    onChange={
                                                        (date?: Date) => {
                                                            if (date) {
                                                                setStartDateTime(date);
                                                                setDatesDirty(true);
                                                            }
                                                        }
                                                    }
                                                />
                                            </VStack>
                                            <VStack align="left">
                                                <Text>End Date/Time:</Text>
                                                <AppDateTimePicker
                                                    value={endDateTime}
                                                    minDate={startDateTime}
                                                    onChange={
                                                        (date?: Date) => {
                                                            if (date) {
                                                                setEndDateTime(date);
                                                                setDatesDirty(true);
                                                            }
                                                        }
                                                    }
                                                />
                                            </VStack>
                                            <VStack align="left">
                                                <Button
                                                    width={50}
                                                    backgroundColor="orange.300"
                                                    color="white"
                                                    disabled={!datesDirty}
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
                                    </Accordion.ItemBody>
                                </Accordion.ItemContent>
                            </Accordion.Item>
                        </Accordion.Root>
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
            <Separator />
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
                                disabled={!enableDelete}
                                onClick={
                                    () => {
                                        props.deleteEvent();
                                        props.onClose();
                                    }
                                }
                            >
                                Delete
                                <BsTrash2 />
                            </Button>
                            <Switch.Root
                                size="sm"
                                colorPalette="orange"
                                onCheckedChange={
                                    (e) => {
                                        setEnableDelete(e.checked);
                                    }
                                }
                            >
                                <Switch.HiddenInput />
                                <Switch.Control>
                                    <Switch.Thumb />
                                </Switch.Control>
                            </Switch.Root>
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
