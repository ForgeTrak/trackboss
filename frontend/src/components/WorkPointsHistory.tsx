/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unused-prop-types */
import _ from 'lodash';
import moment from 'moment';
import { Heading, VStack, useDisclosure } from '@chakra-ui/react';
import React, { createRef, RefObject, useContext, useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import { Job } from '../../../src/typedefs/job';
import { UserContext } from '../contexts/UserContext';
import { getJobList, modifyJobPoints, deleteJob, removeSignup } from '../controller/job';
import { getWorkPointsByMembership, getWorkPointsTotal } from '../controller/workPoints';
import { getYearlyThreshold, getYearlyThresholdValue } from '../controller/billing';
// eslint-disable-next-line import/no-named-as-default
import AddPointsModal from './AddPointsModal';
import YearsDropDown from './shared/YearsDropDown';
import EditPointsModal from './modals/EditPointsModal';

const columns: any = [
    {
        name: 'Date',
        selector: (row: Job) => `${moment(row.start).utc().format('MM/DD/YYYY')}`,
        sortable: true,
        wrap: true,
    },
    {
        name: 'Job',
        selector: (row: Job) => `${row.title}`,
        wrap: true,
        sortable: true,
    },
    {
        name: 'Points',
        selector: (row: Job) => {
            const isFutureSignup = moment(row.end).isAfter();
            if (isFutureSignup) {
                return `(${row.pointsAwarded} pending)`;
            }
            if (row.paid) {
                return 0;
            }
            return row.pointsAwarded;
        },
        sortable: true,
    },
    {
        name: 'Earned By',
        selector: (row: Job) => `${row.member}`,
        wrap: true,
        sortable: true,
    },
];

const customStyles = {
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
};

export default function WorkPointsHistory() {
    const [cells, setCells] = useState<Job[]>([]);
    const [allJobs, setAllJobs] = useState<Job[]>([]);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [years, setYears] = useState<number[]>([]);
    const [workPointsEarned, setWorkPointsEarned] = useState<number>(0);
    const [workPointsThreshold, setWorkPointsThreshold] = useState<number>(0);
    const [selectedJob, setSelectedJob] = useState<Job>();
    const { isOpen, onOpen, onClose } = useDisclosure();

    const { state } = useContext(UserContext);

    async function getJobsData() {
        const jobs =
            await getJobList(state.token, 'membershipID', state.user!.membershipId as unknown as string) as Job[];
        jobs.sort((a, b) => {
            let order = 0;
            if (a.start < b.start) {
                order = 1;
            } else if (a.start > b.start) {
                order = -1;
            }
            return order;
        });
        if ('reason' in jobs) {
            // squash error
        } else {
            const allYears: number[] = [];
            // find the first year they were a member.
            let firstYear = parseInt(state.user?.dateJoined.substring(0, 4) || '0', 10);
            if (firstYear < 2016) {
                // We have historical data going back at least this far for a handful of folks.  A Bit of a hack to do
                // it this way but we needed some quick solutions so we could get life member for a few of the longer
                // term folks.
                firstYear = 2011;
            }
            const currentYear = new Date().getFullYear();
            for (let dropdownYear = firstYear; dropdownYear <= currentYear; dropdownYear++) {
                allYears.push(dropdownYear);
            }
            // reverse sort the years so that most recent is always at the top
            const sortedYears = allYears.sort((a, b) => (b - a));
            setYears(sortedYears);
            setAllJobs(jobs);
        }
    }

    useEffect(() => {
        getJobsData();
    }, []);

    useEffect(() => {
        setCells(_.filter(allJobs, (job) => new Date(job.start).getFullYear() === year));
        async function getData() {
            const workPoints = await getWorkPointsByMembership(state.token, state.user!.membershipId, year);
            const threshold = await getYearlyThreshold(state.token, year);
            if ('reason' in workPoints) {
                setWorkPointsEarned(0);
            } else {
                setWorkPointsEarned(workPoints.total);
            }
            if ('reason' in threshold) {
                // squash
            } else {
                setWorkPointsThreshold(threshold.threshold);
            }
        }
        getData();
    }, [year, allJobs]);

    const userActive = state.user?.active || false;
    const adminOrActingAsAdmin = (
        (state.storedUser?.memberType === 'Admin' || state.user?.memberType === 'Admin') &&
        (userActive)
    );
    return (
        <VStack bg="white">
            <YearsDropDown
                years={years}
                header="Work Points History"
                setYear={setYear}
                initialYear={(new Date()).getFullYear()}
            />
            <Heading color="orange" size="2xl">
                {`${workPointsEarned}/${workPointsThreshold}`}
            </Heading>
            <AddPointsModal
                memberName={state?.user?.firstName || ''}
                membershipId={state?.user?.membershipId || 0}
                memberId={state?.user?.memberId as number}
                // eslint-disable-next-line max-len
                visible={adminOrActingAsAdmin}
                token={state.token}
                // eslint-disable-next-line react/jsx-no-bind
                refreshPoints={getJobsData}
            />
            <DataTable
                columns={columns}
                data={cells}
                fixedHeaderScrollHeight="300px"
                highlightOnHover
                pagination
                responsive
                subHeaderWrap
                customStyles={customStyles}
                onRowClicked={
                    (row: Job) => {
                        setSelectedJob(row);
                        if (adminOrActingAsAdmin) {
                            onOpen();
                        }
                    }
                }
            />
            <EditPointsModal
                memberName={state.user?.firstName || ''}
                selectedJob={selectedJob || {} as Job}
                // eslint-disable-next-line react/jsx-no-bind
                refreshPoints={getJobsData}
                isOpen={isOpen}
                onClose={onClose}
            />
        </VStack>
    );
}
