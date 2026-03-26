import React, { useEffect, useState, useContext } from 'react';
import moment from 'moment';
import { Calendar, DateLocalizer, momentLocalizer, SlotInfo, Views } from 'react-big-calendar';
import { Box, Button } from '@chakra-ui/react';
import { useAppDisclosure } from '../hooks/useAppDisclosure';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import SelectedEventModal from './SelectedEventModal';
import { UserContext } from '../contexts/UserContext';
import { deleteJob, updateJob } from '../controller/job';
import { DeleteEventResponse, Event, PostNewEventRequest } from '../../../src/typedefs/event';
import { Job, PatchJobRequest } from '../../../src/typedefs/job';
import { createEvent, deleteEvent, getCalendarEventsAndJobs, getNextEvent } from '../controller/event';
import { ErrorResponse } from '../../../src/typedefs/errorResponse';
import CreateEventModal from './CreateEventModal';

const localizer: DateLocalizer = momentLocalizer(moment);

export default function EventCalendar() {
    const { state } = useContext(UserContext);
    const { onClose: onViewEventClose, isOpen: isViewEventOpen, onOpen: onViewEventOpen } = useAppDisclosure();
    const { onClose: onCreateClose, isOpen: isCreateOpen, onOpen: onCreateOpen } = useAppDisclosure();

    const [selectedEvent, setSelectedEvent] = useState<Event | Job>();
    const [calendarEvents, setCalendarEvents] = useState<Array<Job | Event>>([]);
    const [error, setError] = useState<string>('');
    const [defaultDate, setDefaultDate] = useState<Date>();
    const [defaultStartDate, setDefaultStartDate] = useState<Date>(new Date());
    const [defaultEndDate, setDefaultEndDate] = useState<Date>(new Date());

    async function setNewEvent(newEvent: PostNewEventRequest) {
        const startDate = moment(newEvent.startDate);
        const endDate = moment(newEvent.endDate);
        // The server's expected format, ends at minutes
        newEvent.startDate = startDate.toISOString(true).slice(0, -10);
        newEvent.endDate = endDate.toISOString(true).slice(0, -10);

        await createEvent(state.token, newEvent);
        const test = await getCalendarEventsAndJobs(state.token);
        setCalendarEvents(test);
    }

    async function signUpForJob(patchInfo: { jobId: number, editedJob: PatchJobRequest }) {
        const res = await updateJob(state.token, patchInfo.jobId, patchInfo.editedJob);
        if ('reason' in res) {
            setError(res.reason);
        } else {
            setCalendarEvents(await getCalendarEventsAndJobs(state.token));
        }
    }

    async function deleteEventLocal() {
        if (selectedEvent && 'eventType' in selectedEvent) {
            const response: DeleteEventResponse | ErrorResponse = await deleteEvent(state.token, selectedEvent.eventId);
            if ('reason' in response) {
                setError(response.reason);
            } else {
                const newCalendarEvents = calendarEvents.filter((e: any) => e.eventType !== selectedEvent?.eventType);
                setCalendarEvents(newCalendarEvents);
            }
        } else if (selectedEvent) {
            const response = await deleteJob(state.token, selectedEvent.jobId);
            if ('reason' in response) {
                setError(response.reason);
            } else {
                const newCalendarEvents = calendarEvents.filter((e: any) => e.jobId !== selectedEvent?.jobId);
                setCalendarEvents(newCalendarEvents);
            }
        }
    }

    async function refreshEvents() {
        const events = await getCalendarEventsAndJobs(state.token);
        setCalendarEvents(events);
    }

    useEffect(() => {
        async function getData() {
            const calendarEventsAndJobs = await getCalendarEventsAndJobs(state.token);
            setCalendarEvents(calendarEventsAndJobs);
        }
        getData();
    }, []);

    useEffect(() => {
        async function getData() {
            const nextEvent = await getNextEvent(state.token) as Event;
            let nextEventDate = new Date();
            if (nextEvent?.start) {
                nextEventDate = moment(nextEvent.start).toDate();
            }
            setDefaultDate(nextEventDate);
        }
        getData();
    }, []);

    return (
        <div>
            { error !== '' && ({ error }) }
            <Box pt={5} pb={5}>
                <Button
                    background="orange.300"
                    color="white"
                    isDisabled={state.user?.memberType !== 'Admin'}
                    onClick={
                        () => {
                            setDefaultStartDate(new Date());
                            setDefaultEndDate(new Date());
                            onCreateOpen();
                        }
                    }
                >
                    Create New Event
                </Button>
            </Box>
            <Calendar
                defaultView={Views.MONTH}
                defaultDate={defaultDate}
                events={calendarEvents}
                selected={selectedEvent}
                onSelectEvent={
                    (calendarEvent) => {
                        setSelectedEvent(calendarEvent);
                        onViewEventOpen();
                    }
                }
                selectable={state.user?.memberType === 'Admin'}
                onSelectSlot={
                    (selectedSlot: SlotInfo) => {
                        setDefaultStartDate(selectedSlot.start);
                        setDefaultEndDate(selectedSlot.end);
                        onCreateOpen();
                    }
                }
                localizer={localizer}
                eventPropGetter={
                    (calendarEvent) => {
                        const newStyle = {
                            backgroundColor: 'lightgrey',
                            color: 'white',
                        };
                        if ('eventType' in calendarEvent) {
                            // newStyle.color = '#FFFFFF';
                            if (calendarEvent.eventType === 'Meeting') {
                                newStyle.backgroundColor = '#76CE6F'; // green
                            } else if (
                                calendarEvent.eventType === 'Yearly Job' ||
                                calendarEvent.eventType === 'Work Day') {
                                newStyle.backgroundColor = '#4B0082'; // purple
                            } else if (
                                calendarEvent.eventType === 'Race' ||
                                calendarEvent.eventType === 'Race Week' ||
                                calendarEvent.eventType === 'XO Race' ||
                                calendarEvent.eventType === 'Harescramble') {
                                newStyle.backgroundColor = '#EE6439'; // red
                            } else if (
                                calendarEvent.eventType === 'Camp and Ride' ||
                                calendarEvent.eventType === 'Ride Day') {
                                newStyle.backgroundColor = '#037ffc';
                            } else { // its a Job
                                newStyle.backgroundColor = '#037ffc';
                            }
                            return {
                                style: newStyle,
                            };
                        }
                        // unreachable
                        return {};
                    }
                }
                style={{ height: '70vh' }}
            />
            {
                selectedEvent && (
                    <SelectedEventModal
                        isOpen={isViewEventOpen}
                        onClose={onViewEventClose}
                        selectedEvent={selectedEvent}
                        admin={state.user?.memberType === 'Admin'}
                        // eslint-disable-next-line react/jsx-no-bind
                        deleteEvent={deleteEventLocal}
                        // eslint-disable-next-line react/jsx-no-bind
                        signUpForJob={signUpForJob}
                        // eslint-disable-next-line react/jsx-no-bind
                        eventsRefresh={refreshEvents}
                    />
                )
            }
            <CreateEventModal
                // eslint-disable-next-line react/jsx-no-bind
                createEvent={setNewEvent}
                onClose={onCreateClose}
                isOpen={isCreateOpen}
                startDateTime={defaultStartDate}
                endDateTime={defaultEndDate}
            />
        </div>
    );
}
