import { Box, Button, Center, Input, VStack } from '@chakra-ui/react';
import React, { useContext, useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import { BsSearch } from 'react-icons/bs';
import { useAppDisclosure } from '../hooks/useAppDisclosure';

import { PaidLabor } from '../../../src/typedefs/paidLabor';
import { UserContext } from '../contexts/UserContext';
import PaidLaborListRow from './PaidLaborListRow';
import PaidLaborModal from './modals/PaidLaborModal';

import { getPaidLaborList } from '../controller/paidLabor';

const columns: any = [
    {
        name: 'Last Name',
        selector: (row: PaidLabor) => row.lastName,
        sortable: true,
    },
    {
        name: 'First Name',
        selector: (row: PaidLabor) => row.firstName,
        sortable: true,
    },
    {
        name: 'Business Name',
        selector: (row: PaidLabor) => row.businessName,
        sortable: true,
    },
    {
        name: 'Phone',
        selector: (row: PaidLabor) => row.phoneNumber,
        sortable: true,
    },
    {
        name: 'Email',
        selector: (row: PaidLabor) => row.email,
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

export default function PaidLaborList() {
    const [cells, setCells] = useState<PaidLabor[]>([]);
    const [allCells, setAllCells] = useState<PaidLabor[]>([]);

    const { state } = useContext(UserContext);
    const [error, setError] = useState<any | undefined>(undefined);

    const [searchTerm, setSearchTerm] = useState<string>('');

    const { isOpen: isCreateOpen, onClose: onCreateClose, onOpen: onCreateOpen } = useAppDisclosure();

    async function getPaidLaborData() {
        let paidLabor : PaidLabor[] = [];
        try {
            paidLabor = await getPaidLaborList(state.token) as PaidLabor[];
        } catch (e) {
            setError(e);
        }
        setCells(paidLabor);
        setAllCells(paidLabor);
    }

    useEffect(() => {
        getPaidLaborData();
    }, [2024]);

    useEffect(() => {
        if (searchTerm === '') {
            setCells(allCells);
        } else {
            const newCells =
                allCells.filter((cell: any) => {
                    const firstNameFound = cell.firstName.toLowerCase().includes(searchTerm);
                    const lastNameFound = cell.lastName.toLowerCase().includes(searchTerm);
                    const titleFound = cell.title?.toLowerCase().includes(searchTerm);
                    return (firstNameFound || lastNameFound || titleFound);
                });
            setCells(newCells);
        }
    }, [searchTerm, allCells]);

    if (error) {
        return (
            <div>
                {error.reason}
            </div>
        );
    }
    return (
        <div>
            <Center>
                <VStack>
                    <Box maxWidth={300} position="relative">
                        <Box
                            position="absolute"
                            left={3}
                            top="50%"
                            transform="translateY(-50%)"
                            pointerEvents="none"
                            zIndex={1}
                        >
                            <BsSearch color="gray" />
                        </Box>
                        <Input
                            size="lg"
                            pl={10}
                            borderRadius="md"
                            placeholder="Search..."
                            onChange={(e) => setSearchTerm(e.target.value?.toLowerCase())}
                        />
                    </Box>
                    <Button
                        backgroundColor="orange.300"
                        color="white"
                        onClick={
                            () => {
                                onCreateOpen();
                            }
                        }
                    >
                        Create new paid laborer
                    </Button>
                </VStack>
            </Center>
            <DataTable
                columns={columns}
                data={cells}
                fixedHeaderScrollHeight="300px"
                highlightOnHover
                expandableRows={state.user?.memberType === 'Admin'}
                expandableRowsComponent={PaidLaborListRow}
                expandableRowsComponentProps={
                    {
                        updateCallback: getPaidLaborData,
                    }
                }
                pagination
                paginationPerPage={20}
                responsive
                striped
                subHeaderWrap
                defaultSortFieldId={1}
                customStyles={customStyles}
                paginationComponentOptions={
                    {
                        selectAllRowsItem: true,
                    }
                }
            />
            <PaidLaborModal
                editMode={false}
                isOpen={isCreateOpen}
                onClose={
                    () => {
                        onCreateClose();
                        getPaidLaborData();
                    }
                }
            />
        </div>
    );
}
