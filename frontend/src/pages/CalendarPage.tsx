import React from 'react';
import { Box } from '@chakra-ui/react';
import EventCalendar from '../components/EventCalendar';
import Header from '../components/Header';
import 'react-big-calendar/lib/css/react-big-calendar.css';

function CalendarPage() {
    return (
        <>
            <Header title="Calendar" activeButtonId={2} />
            <Box p={5} pt={3} pl={10} pr={10}>
                <EventCalendar />
            </Box>
        </>
    );
}

export default CalendarPage;
