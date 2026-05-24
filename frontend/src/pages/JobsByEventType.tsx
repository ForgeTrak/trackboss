import React from 'react';
import { Tabs } from '@chakra-ui/react';
import { FaMoneyCheck, FaTeamspeak } from 'react-icons/fa';

import Header from '../components/Header';
import EventSignupSheet from '../components/EventSignupSheet';
import PaidLaborList from '../components/PaidLaborList';

function JobsByEventType() {
    return (
        <>
            <Header title="Race Administration" activeButtonId={6} />
            <Tabs.Root variant="subtle" bg="white" colorPalette="orange" defaultValue="events">
                <Tabs.List>
                    <Tabs.Trigger rounded="md" value="events">
                        Event Job Structure
                        &nbsp;
                        <FaTeamspeak />
                    </Tabs.Trigger>
                    <Tabs.Trigger rounded="md" value="labor">
                        Paid Labor
                        &nbsp;
                        <FaMoneyCheck />
                    </Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="events">
                    <EventSignupSheet />
                </Tabs.Content>
                <Tabs.Content value="labor">
                    <PaidLaborList />
                </Tabs.Content>
            </Tabs.Root>
        </>
    );
}

export default JobsByEventType;
