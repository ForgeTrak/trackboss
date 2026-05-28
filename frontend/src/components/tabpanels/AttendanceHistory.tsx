import { Button, Center, Heading, Text, VStack } from '@chakra-ui/react';
import React, { useContext, useEffect, useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import DataTable from 'react-data-table-component';
import { Attendance } from '../../../../src/typedefs/attendance';
import { UserContext } from '../../contexts/UserContext';
import { checkIn, getAttendanceByMember } from '../../controller/attendance';
import { useAppToast } from '../../hooks/useAppToast';
import dataTableStyles from '../shared/DataTableStyles';
import YearsDropDown from '../shared/YearsDropDown';

export default function AttendanceHistory() {
    const { state } = useContext(UserContext);
    const toast = useAppToast();
    const [records, setRecords] = useState<Attendance[]>([]);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [years, setYears] = useState<number[]>([]);

    async function loadAttendance() {
        if (!state.user) return;
        try {
            const data = await getAttendanceByMember(state.token, state.user.memberId, year);
            if (!('reason' in data)) {
                setRecords(data);
            }
        } catch (error) {
            // squash error
        }
    }

    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const yearList: number[] = [];
        for (let y = currentYear; y >= currentYear - 3; y--) {
            yearList.push(y);
        }
        setYears(yearList);
    }, []);

    useEffect(() => {
        loadAttendance();
    }, [year, state.user]);

    async function handleCheckIn() {
        try {
            const result = await checkIn(state.token, state.user!.memberId, state.user!.membershipId);
            if ('reason' in result) {
                if (result.reason === 'already checked in today') {
                    toast.warning({
                        title: 'Already checked in',
                        description: 'You have already checked in today.',
                    });
                } else {
                    toast.error({
                        title: 'Check-in failed',
                        description: 'Unable to record your visit. Please try again.',
                    });
                }
            } else {
                toast.success({
                    title: 'Checked in!',
                    description: 'Your visit has been recorded.',
                });
                loadAttendance();
            }
        } catch (error) {
            toast.error({
                title: 'Check-in failed',
                description: 'Unable to record your visit. Please try again.',
            });
        }
    }

    const columns: any = [
        {
            name: 'Date',
            selector: (row: Attendance) => formatInTimeZone(row.checkInTime, 'America/New_York', 'EEEE, MMMM d yyyy'),
            sortable: true,
            wrap: true,
        },
        {
            name: 'Time',
            selector: (row: Attendance) => formatInTimeZone(row.checkInTime, 'America/New_York', 'h:mm a'),
            sortable: false,
        },
    ];

    return (
        <VStack mt={25} gap={4}>
            <Button
                size="lg"
                backgroundColor="orange"
                color="white"
                _hover={{ bg: 'orange.400' }}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={handleCheckIn}
            >
                Check In Now
            </Button>
            <Text fontSize="sm" color="gray.500" textAlign="center" px={4}>
                Note that check-ins are for personal record keeping only. They do not count towards
                work points, meeting, or event attendance.
            </Text>
            <Center>
                <YearsDropDown
                    years={years}
                    initialYear={new Date().getFullYear()}
                    header="My Visits"
                    setYear={setYear}
                />
            </Center>
            <Heading color="orange" size="xl">
                {`${records.length} check-in${records.length !== 1 ? 's' : ''}`}
            </Heading>
            <DataTable
                columns={columns}
                data={records}
                customStyles={dataTableStyles()}
                fixedHeaderScrollHeight="300px"
                highlightOnHover
                pagination
                paginationPerPage={20}
                responsive
                striped
                subHeaderWrap
            />
        </VStack>
    );
}
