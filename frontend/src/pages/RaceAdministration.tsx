import React from 'react';
import { ChakraProvider, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { FaMoneyCheck, FaTeamspeak } from 'react-icons/fa';

import theme from '../theme';
import Header from '../components/Header';
import EventSignupSheet from '../components/EventSignupSheet';
import PaidLaborList from '../components/PaidLaborList';

function RaceAdministration() {
    return (
        <ChakraProvider theme={theme}>
            <Header title="Race Administration" activeButtonId={6} />
            <Tabs variant="soft-rounded" bg="white" colorScheme="orange">
                <TabList>
                    <Tab>
                        Event Job Structure
                        &nbsp;
                        <FaTeamspeak />
                    </Tab>
                    <Tab>
                        Paid Labor
                        &nbsp;
                        <FaMoneyCheck />
                    </Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
                        <EventSignupSheet />
                    </TabPanel>
                    <TabPanel>
                        <PaidLaborList />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </ChakraProvider>
    );
}

export default RaceAdministration;
