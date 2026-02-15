import React, { useState, useEffect, useContext } from 'react';
import { Box } from '@chakra-ui/react';
import { UserContext } from '../contexts/UserContext';
import EventCalendar from '../components/EventCalendar';
import Header from '../components/Header';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getCalendarEventsAndJobs } from '../controller/event';

function CalendarPage() {
    const { state } = useContext(UserContext);
    // 'any' is needed here for the calendar to render properly
    const [upcomingEvents, setEvents] = useState<any[]>();

    useEffect(() => {
        async function getData() {
            setEvents(await getCalendarEventsAndJobs(state.token));
        }
        getData();
    }, []);
    return (
        <>
            <Header title="Calendar" activeButtonId={2} />
            <Box p={5} pt={3} pl={10} pr={10}>
                {
                    upcomingEvents && (
                        <EventCalendar />
                    )
                }
            </Box>
        </>
    );
}

export default CalendarPage;
