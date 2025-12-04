import { Center, IconButton, useDisclosure } from '@chakra-ui/react';
import React, { useContext, useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import { BsPrinter } from 'react-icons/bs';

import { getYearsForBillingDisplay, calculateApplicationYear } from '../util/billing';
import { MembershipApplication } from '../../../src/typedefs/membershipApplication';
import { UserContext } from '../contexts/UserContext';
import { getMembershipApplicationListExcel, getMembershipApplications } from '../controller/membershipApplication';
import DataSearchBox from './input/DataSearchBox';
import MembershipApplicationModal from './modals/MembershipApplicationModal';
import WrappedSwitchInput from './input/WrappedSwitchInput';
import YearsDropDown from './shared/YearsDropDown';

const columns: any = [
    {
        name: 'ID',
        selector: (row: MembershipApplication) => row.id,
        sortable: true,
        hide: 'sm',
    },
    {
        name: 'Priority',
        selector: (row: MembershipApplication) => (row.applicationPriority ? 'High' : 'Medium'),
        sortable: true,
        hide: 'sm',
    },
    {
        name: 'Last Name',
        selector: (row: MembershipApplication) => row.lastName,
        sortable: true,
    },
    {
        name: 'First Name',
        selector: (row: MembershipApplication) => row.firstName,
        sortable: true,
    },
    {
        name: 'Recommended by',
        selector: (row:MembershipApplication) => row.referredBy,
        sortable: true,
    },
    {
        name: 'Application date',
        selector: (row: MembershipApplication) => row.receivedDate,
        sortable: true,
        wrap: true,
        hide: 'sm',
    },
    {
        name: 'Status',
        selector: (row: MembershipApplication) => row.status,
        sortable: true,
        hide: 'sm',
    },
];

const customStyles = {
    rows: {
        style: {
            minHeight: '65px',
        },
    },
    headCells: {
        style: {
            marginTop: '20px',
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

export default function MembershipApplicationList() {
    const [cells, setCells] = useState<MembershipApplication[]>([]);
    const [filteredCells, setFilteredCells] = useState<MembershipApplication[]>([]);
    const { state } = useContext(UserContext);
    const [dirty, setDirty] = useState<boolean>(false);
    const [showAccepted, setShowAccepted] = useState<boolean>(false);
    const [showReview, setShowReview] = useState<boolean>(false);
    const [showRejected, setShowRejected] = useState<boolean>(false);
    const [applicationYear, setApplicationYear] = useState<number>(calculateApplicationYear());
    const [yearsList, setYearsList] = useState<number[]>([]);
    const [initialYear, setInitialYear] = useState<number>(calculateApplicationYear());

    const { isOpen, onClose, onOpen } = useDisclosure(
        { onClose: () => setDirty((olDirtyGotYaMoney) => !olDirtyGotYaMoney) },
    );
    const [selectedApplication, setSelectedApplication] = useState<MembershipApplication>();
    const [searchTerm, setSearchTerm] = useState<string>('');

    async function getMembershipApplicationsData() {
        const allApplications: MembershipApplication[] =
            await getMembershipApplications(state.token, applicationYear || (new Date().getFullYear()));
        setCells(allApplications);
        setFilteredCells(allApplications);
    }

    useEffect(() => {
        getMembershipApplicationsData();
        getYearsForBillingDisplay(setInitialYear, setYearsList);
    }, [dirty, applicationYear]);

    useEffect(() => {
        if (searchTerm === '') {
            setFilteredCells(cells);
        } else {
            const filteredApplications = cells.filter((application) => {
                const firstNameFound = (application.firstName.toLowerCase().includes(searchTerm));
                const lastNameFound = (application.lastName.toLowerCase().includes(searchTerm));
                const statusFound = (application.status.toLowerCase().includes(searchTerm));
                return firstNameFound || lastNameFound || statusFound;
            });
            setFilteredCells(filteredApplications);
        }
        if (showReview) {
            const reviewOnly = cells.filter((application) => (application.status === 'Review'));
            setFilteredCells(reviewOnly);
        }
        if (showAccepted) {
            const acceptedOnly = cells.filter((application) => (application.status === 'Accepted'));
            setFilteredCells(acceptedOnly);
        }
        if (showRejected) {
            const rejectedOnly = cells.filter((application) => (application.status === 'Rejected'));
            setFilteredCells(rejectedOnly);
        }
    }, [searchTerm, showReview, showAccepted, showRejected, cells]);

    return (
        <div>
            <Center>
                <YearsDropDown
                    years={yearsList}
                    initialYear={initialYear}
                    header="Application Year"
                    setYear={setApplicationYear}
                />
            </Center>
            <Center>
                <DataSearchBox
                    onTextChange={setSearchTerm}
                    searchValue={searchTerm}
                />
                <IconButton
                    size="lg"
                    aria-label="Print"
                    background="orange.300"
                    color="white"
                    mr={2}
                    onClick={
                        async () => {
                            const excelData = await getMembershipApplicationListExcel(state.token, applicationYear);
                            const objectUrl = URL.createObjectURL(excelData);
                            window.location.href = objectUrl;
                        }
                    }
                    icon={<BsPrinter />}
                />
                <WrappedSwitchInput
                    maxWidth={100}
                    defaultChecked={false}
                    wrapperText="Only Show Review"
                    locked={showAccepted}
                    onSwitchChange={
                        () => {
                            setShowReview(!showReview);
                        }
                    }
                />
                <WrappedSwitchInput
                    maxWidth={100}
                    defaultChecked={false}
                    wrapperText="Only Show Accepted"
                    locked={showReview}
                    onSwitchChange={
                        () => {
                            setShowAccepted(!showAccepted);
                        }
                    }
                />
                <WrappedSwitchInput
                    maxWidth={100}
                    defaultChecked={false}
                    wrapperText="Only Show Rejected"
                    locked={showReview}
                    onSwitchChange={
                        () => {
                            setShowRejected(!showRejected);
                        }
                    }
                />
            </Center>
            <DataTable
                columns={columns}
                data={filteredCells as MembershipApplication[]}
                fixedHeaderScrollHeight="300px"
                highlightOnHover
                pagination
                responsive
                striped
                subHeaderWrap
                customStyles={customStyles}
                paginationComponentOptions={
                    {
                        selectAllRowsItem: true,
                    }
                }
                onRowClicked={
                    (row: MembershipApplication) => {
                        setSelectedApplication(row);
                        onOpen();
                    }
                }
            />
            {
                (selectedApplication && (
                    <MembershipApplicationModal
                        isOpen={isOpen}
                        onClose={onClose}
                        // eslint-disable-next-line react/jsx-no-bind
                        addAction={getMembershipApplicationsData}
                        membershipApplication={selectedApplication}
                        token={state.token}
                    />
                )
                )
            }
        </div>
    );
}
