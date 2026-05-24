import { Heading, HStack, Text, VStack } from '@chakra-ui/react';
import React, { useContext, useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import { useAppDisclosure } from '../hooks/useAppDisclosure';
import { Bill } from '../../../src/typedefs/bill';
import { UserContext } from '../contexts/UserContext';
import { getBillsForMembership } from '../controller/billing';
import DuesAndWaiversModal from './modals/DuesAndWaiversModal';

export default function DuesAndWaivers() {
    const { state } = useContext(UserContext);
    const [allBills, setAllBills] = useState<Bill[]>();
    const [selectedBill, setSelectedBill] = useState<Bill>();

    const { isOpen, onClose, onOpen } = useAppDisclosure();

    async function getMembershipBillData() {
        const membershipId = state.user?.membershipId || -1;
        let memberBills : Bill[] = [];
        try {
            memberBills = await getBillsForMembership(state.token, membershipId) as Bill[];
        } catch (error) {
            // console.log(error);
        }
        setAllBills(memberBills as Bill[]);
    }

    useEffect(() => {
        getMembershipBillData();
    }, []);

    const columns: any = [
        {
            name: 'Year',
            selector: (row: Bill) => row.year,
            sortable: true,
            maxWidth: '25',
            id: 'year',
        },
        {
            name: 'Points',
            selector: (row: Bill) => `${row.pointsEarned} of ${row.pointsThreshold}`,
            sortable: true,
            maxWidth: '25',
        },
        {
            name: 'Balance Due',
            selector: (row: Bill) => {
                if (!row.curYearPaid) {
                    return `$${row.amount} ($${row.amountWithFee})`;
                }
                return '$0.00 ($0.00)';
            },
            sortable: true,
            maxWidth: '25',
        },
        {
            name: 'Insurance Validated',
            selector: (row: Bill) => (row.curYearIns ? 'Yes' : 'No'),
            maxWidth: '10',
            hide: 'sm',
        },
        {
            name: 'Due Date',
            selector: (row: Bill) => `${row.dueDate}`,
            wrap: true,
            hide: 'sm',
        },
        {
            name: 'Generated on',
            selector: (row: Bill) => `${row.generatedDate}`,
            sortable: true,
            hide: 'sm',
        },
    ];
    return (
        <VStack mt={25}>
            <HStack>
                <Heading>Dues and Waivers</Heading>
            </HStack>
            <Text textAlign="left">
                Your dues for 2023 and beyond are displayed below.  Note that payment links will be available on or
                around December 1.  Until then, you can see your projected amount based on the work you have completed
                so far.  This will change as you earn more points.  Billing is updated daily.
            </Text>
            <DataTable
                columns={columns}
                data={allBills as Bill[]}
                defaultSortFieldId="year"
                defaultSortAsc={false}
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
                onRowClicked={
                    (row: Bill) => {
                        setSelectedBill(row);
                        onOpen();
                    }
                }
                fixedHeaderScrollHeight="300px"
                highlightOnHover
                responsive
                subHeaderWrap
            />
            <DuesAndWaiversModal
                viewBill={selectedBill}
                token={state.token}
                insuranceAttested={selectedBill?.curYearIns || false}
                isOpen={isOpen}
                onClose={
                    async () => {
                        await getMembershipBillData();
                        onClose();
                    }
                }
            />
        </VStack>
    );
}
