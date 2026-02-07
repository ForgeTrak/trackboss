import React, { useContext, useEffect, useState } from 'react';
import {
    Box, Button, Heading, HStack, Menu, MenuButton, MenuItem, MenuList, VStack,
} from '@chakra-ui/react';
import { BsChevronDown } from 'react-icons/bs';
import _ from 'lodash';
import DataTable, { Media } from 'react-data-table-component';
import { useAppDisclosure } from '../hooks/useAppDisclosure';

import { UserContext } from '../contexts/UserContext';
import { getJobTypeListEventType } from '../controller/jobType';
import { getEventTypeList } from '../controller/eventType';
import { EventType } from '../../../src/typedefs/eventType';
import { JobType } from '../../../src/typedefs/jobType';
import SignupSheetJobsRow from './SignupSheetJobsRow';
import AddEventTypeModal from './modals/AddEventTypeModal';
import AddJobTypeModal from './modals/AddJobTypeModal';

function EventSignupSheet() {
    const { state } = useContext(UserContext);
    const isAdminUser = state.user?.memberType === 'Admin';
    const [eventTypes, setEventTypes] = useState<EventType[]>();
    const [selectedEventType, setSelectedEventType] = useState<string>();
    const [selectedEventTypeId, setSelectedEventTypeId] = useState<number>();
    const [eventJobTypes, setEventJobTypes] = useState<JobType[]>();
    const {
        isOpen: isAddEventTypeOpen,
        onOpen: onAddEventTypeOpen,
        onClose: onAddEventTypeClose,
    } = useAppDisclosure();

    const {
        isOpen: isAddJobTypeOpen,
        onOpen: onAddJobTypeOpen,
        onClose: onAddJobTypeClose,
    } = useAppDisclosure();

    async function getEventTypeData() {
        if (selectedEventType) {
            const jobs = (await getJobTypeListEventType(state.token, selectedEventType)) as JobType[];
            jobs.sort((a, b) => {
                const jobDayDiff = a.jobDayNumber - b.jobDayNumber;
                if (jobDayDiff === 0) {
                    return (a.sortOrder - b.sortOrder);
                }
                return jobDayDiff;
            });
            setEventJobTypes(jobs);
        }
    }

    async function getEventTypeListData() {
        const eventTypeList = (await getEventTypeList(state.token)) as EventType[];
        setEventTypes(eventTypeList);
        const autoSelectEvent = 0;
        setSelectedEventType(eventTypeList[autoSelectEvent].type);
        setSelectedEventTypeId(eventTypeList[autoSelectEvent].eventTypeId);
    }

    // get the API data from the jobType API
    useEffect(() => {
        getEventTypeListData();
    }, []);

    useEffect(() => {
        getEventTypeData();
    }, [selectedEventType]);

    // Put it in a table
    const rowCallbackProp = {
        refreshData: async () => {
            await getEventTypeData();
        },
    };

    return (
        <VStack>
            <HStack>
                <Heading size="md">
                    {`Job Structure for ${selectedEventType}`}
                </Heading>
                <Menu>
                    <MenuButton bg="orange" color="white" as={Button} rightIcon={<BsChevronDown />} />
                    <MenuList defaultValue={selectedEventType}>
                        {
                            _.map(eventTypes, (listEvent) => (
                                <MenuItem
                                    key={listEvent.type}
                                    onClick={
                                        () => {
                                            setSelectedEventType(listEvent.type);
                                            setSelectedEventTypeId(listEvent.eventTypeId);
                                        }
                                    }
                                >
                                    {listEvent.type}
                                </MenuItem>
                            ))
                        }
                    </MenuList>
                </Menu>
                {
                    isAdminUser && (
                        <>
                            <Button
                                backgroundColor="orange"
                                color="white"
                                onClick={onAddEventTypeOpen}
                            >
                                +
                            </Button>
                            <AddEventTypeModal
                                isOpen={isAddEventTypeOpen}
                                onClose={onAddEventTypeClose}
                                // eslint-disable-next-line react/jsx-no-bind
                                addAction={getEventTypeListData}
                                token={state.token}
                                userId={state.user?.memberId as number}
                            />
                        </>
                    )
                }
            </HStack>
            <Box>
                <Button
                    backgroundColor="orange.300"
                    color="white"
                    onClick={onAddJobTypeOpen}
                >
                    Create new &nbsp;
                    {selectedEventType}
                    &nbsp;
                    job
                </Button>
                <AddJobTypeModal
                    eventType={selectedEventType as string}
                    eventTypeId={selectedEventTypeId as number}
                    isOpen={isAddJobTypeOpen}
                    onClose={onAddJobTypeClose}
                    // eslint-disable-next-line react/jsx-no-bind
                    addAction={getEventTypeData}
                    token={state.token}
                    userId={state.user?.memberId as number}
                />
            </Box>
            <DataTable
                columns={
                    [
                        {
                            name: 'Title',
                            selector: (row: JobType) => `${row.title} (id: ${row.jobTypeId})`,
                            sortable: true,
                            maxWidth: '150',
                            wrap: true,
                        },
                        {
                            name: 'Points',
                            selector: (row: JobType) => row.pointValue,
                            sortable: true,
                            maxWidth: '50',
                        },
                        {
                            name: 'Cash',
                            selector: (row: JobType) => row.cashValue,
                            sortable: true,
                            maxWidth: '50',
                            hide: Media.SM,
                        },
                        {
                            name: 'Job Day',
                            selector: (row: JobType) => row.jobDay,
                            sortable: true,
                            sortFunction: (rowA, rowB) => rowA.jobDayNumber - rowB.jobDayNumber,
                        },
                        {
                            name: 'Meal Ticket',
                            selector: (row: JobType) => (row.mealTicket ? 'Yes' : 'No'),
                            maxWidth: '50',
                            hide: Media.SM,
                        },
                        {
                            name: 'Number of positions',
                            selector: (row: JobType) => row.count || 1,
                            maxWidth: '50',
                            hide: Media.SM,
                        },
                        {
                            name: 'Display Order',
                            selector: (row: JobType) => row.sortOrder,
                            sortable: true,
                            maxWidth: '50',
                            hide: Media.SM,
                        },
                    ]
                }
                data={eventJobTypes as any}
                customStyles={
                    {
                        headCells: {
                            style: {
                                paddingTop: '0',
                                fontSize: '1.5em',
                                backgroundColor: '#f9f9f9',
                                color: '#626262',
                            },
                        },
                        cells: {
                            style: {
                                fontSize: '1.2em',
                            },
                        },
                    }
                }
                expandableRows
                expandableRowsComponent={SignupSheetJobsRow}
                expandableRowsComponentProps={rowCallbackProp}
                striped
                responsive
            />
            <Box height="10" />
        </VStack>
    );
}
export default EventSignupSheet;
