import {
    Alert,
    Box,
    Button,
    Center,
    Heading,
    HStack,
    IconButton,
    Link,
    NativeSelect,
    Stat,
    Text,
    VStack,
} from '@chakra-ui/react';
import React, { useContext, useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import { BsCashCoin, BsPrinter } from 'react-icons/bs';
import AppModal from '../AppModal';
import { Bill } from '../../../../src/typedefs/bill';
import { UserContext } from '../../contexts/UserContext';

import { useAppDisclosure } from '../../hooks/useAppDisclosure';
import {
    attestInsurance, discountBill, getBillListExcel, getBills, markContactedAndRenewing, payBill,
} from '../../controller/billing';
import DataSearchBox from '../input/DataSearchBox';
import WrappedSwitchInput from '../input/WrappedSwitchInput';
import BillingStatsDisplay from './BillingStatsDisplay';
import dataTableStyles from './DataTableStyles';
import { calculateBillingYear, getYearsForBillingDisplay } from '../../util/billing';
import YearsDropDown from './YearsDropDown';

export default function DuesAndWaiversList() {
    const { state } = useContext(UserContext);
    const [allBillsData, setAllBillsData] = useState<Bill[]>([]);
    const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
    const [markedPaid, setMarkedPaid] = useState<number>(0);
    const [markedAttested, setMarkedAttested] = useState<number>(0);
    const [owesZero, setOwesZero] = useState<number>(0);
    const [allDone, setAllDone] = useState<number>(0);
    const [selectedBill, setSelectedBill] = useState<Bill>();
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterNoPayment, setFilterNoPayment] = useState<boolean>(false);
    const [filterPaperwork, setFilterPaperwork] = useState<boolean>(false);
    const [filterPaid, setFilterPaid] = useState<boolean>(false);
    const [paymentMethod, setPaymentMethod] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<number>(calculateBillingYear());
    const [yearsList, setYearsList] = useState<number[]>([]);
    const [initialYear, setInitialYear] = useState<number>(calculateBillingYear());

    const { isOpen, onClose, onOpen } = useAppDisclosure();

    async function getMembershipBillData() {
        let memberBills : Bill[] = [];
        try {
            memberBills = await getBills(state.token, selectedYear) as Bill[];
        } catch (error) {
            // console.log(error);
        }
        let attested = 0;
        let paid = 0;
        let owesNothing = 0;
        let completed = 0;
        memberBills.forEach((bill) => {
            if (bill.curYearIns) attested++;
            if (bill.curYearPaid) paid++;
            if (bill.amount.toString() === '0.00') owesNothing++;
            if (bill.curYearIns && bill.curYearPaid) completed++;
        });
        setAllBillsData(memberBills as Bill[]);
        setFilteredBills(memberBills as Bill[]);
        setMarkedPaid(paid);
        setMarkedAttested(attested);
        setOwesZero(owesNothing);
        setAllDone(completed);
    }

    async function runFilters() {
        if (filterNoPayment) {
            const zeroDollarBills = filteredBills.filter((bill) => (bill.amount > 0));
            setFilteredBills(zeroDollarBills);
        }
        if (filterPaperwork) {
            const paperworkBills = filteredBills.filter((bill) => (!bill.curYearIns));
            setFilteredBills(paperworkBills);
        }
        if (filterPaid) {
            const paidBills = filteredBills.filter((bill) => (!bill.curYearPaid));
            setFilteredBills(paidBills);
        }
        // if no filters, set data to all data
        if ((searchTerm === '') && !filterNoPayment && !filterPaperwork && !filterPaid) {
            setFilteredBills(allBillsData);
        }
    }

    useEffect(() => {
        getMembershipBillData();
        getYearsForBillingDisplay(setInitialYear, setYearsList);
    }, [selectedYear]);

    useEffect(() => {
        if (searchTerm === '') {
            setFilteredBills(allBillsData);
        } else {
            const nameBills = allBillsData.filter((bill:Bill) => {
                const firstNameFound = (bill.firstName.toLowerCase().includes(searchTerm));
                const lastNameFound = (bill.lastName.toLowerCase().includes(searchTerm));
                return (firstNameFound || lastNameFound);
            });
            setFilteredBills(nameBills);
        }
    }, [searchTerm]);

    useEffect(() => {
        runFilters();
    }, [filterNoPayment, filterPaid, filterPaperwork]);

    const columns: any = [
        {
            name: 'Last Name',
            selector: (row: Bill) => row.lastName,
            sortable: true,
            maxWidth: '10',
        },
        {
            name: 'First Name',
            selector: (row: Bill) => row.firstName,
            sortable: true,
            maxWidth: '10',
        },
        {
            name: 'Points Earned',
            selector: (row: Bill) => row.pointsEarned,
            sortable: true,
            maxWidth: '10',
            hide: 'sm',
        },
        {
            name: 'Amount',
            selector: (row: Bill) => `$${row.amount} ($${row.amountWithFee})`,
            sortable: true,
            maxWidth: '5',
        },
        {
            name: 'Type',
            selector: (row: Bill) => row.membershipType,
            sortable: true,
            hide: 'sm',
        },
        {
            name: 'Insurance Validated',
            selector: (row: Bill) => (row.curYearIns ? 'Yes' : 'No'),
            sortable: true,
            maxWidth: '5',
        },
        {
            name: 'Bill paid',
            selector: (row:Bill) => (row.curYearPaid ? 'Yes' : 'No'),
            sortable: true,
            maxWidth: '5',
        },
        {
            name: 'Contacted/Renewing',
            selector: (row:Bill) => (row.contactedAndRenewing ? 'Yes' : 'No'),
            sortable: true,
            maxWidth: '5',
        },
    ];

    return (
        <VStack mt={25}>
            <Center>
                <YearsDropDown
                    years={yearsList}
                    initialYear={initialYear}
                    header="Billing data"
                    setYear={setSelectedYear}
                />
            </Center>
            <Stat.Root>
                <Stat.Root>
                    <Stat.Label>Paid or Owes $0</Stat.Label>
                    <Stat.ValueText>{markedPaid}</Stat.ValueText>
                    <Stat.HelpText>{`${owesZero} owe $0`}</Stat.HelpText>
                </Stat.Root>
                <Stat.Root>
                    <Stat.Label>
                        {`${allBillsData.length - owesZero} members owe`}
                    </Stat.Label>
                    <Stat.ValueText>{`${markedPaid - owesZero}`}</Stat.ValueText>
                    <Stat.HelpText>are paid</Stat.HelpText>
                </Stat.Root>
                <Stat.Root>
                    <Stat.Label>Rules and Insurance</Stat.Label>
                    <Stat.ValueText>{markedAttested}</Stat.ValueText>
                    <Stat.HelpText>{`Of ${allBillsData.length}`}</Stat.HelpText>
                </Stat.Root>
                <Stat.Root>
                    <Stat.Label>Completed all</Stat.Label>
                    <Stat.ValueText>{`${((allDone / allBillsData.length) * 100).toFixed(2)}%`}</Stat.ValueText>
                    <Stat.HelpText>{allDone}</Stat.HelpText>
                </Stat.Root>
            </Stat.Root>
            <HStack>
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
                            const excelData = await getBillListExcel(state.token);
                            const objectUrl = URL.createObjectURL(excelData);
                            window.location.href = objectUrl;
                        }
                    }
                >
                    <BsPrinter />
                </IconButton>
            </HStack>
            <HStack>
                <WrappedSwitchInput
                    defaultChecked={false}
                    maxWidth={300}
                    wrapperText="Hide members paying $0"
                    onSwitchChange={
                        () => {
                            setFilterNoPayment(!filterNoPayment);
                        }
                    }
                />
                <WrappedSwitchInput
                    defaultChecked={false}
                    maxWidth={300}
                    wrapperText="Hide members with completed paperwork"
                    onSwitchChange={
                        () => {
                            setFilterPaperwork(!filterPaperwork);
                        }
                    }
                />
                <WrappedSwitchInput
                    defaultChecked={false}
                    maxWidth={300}
                    wrapperText="Hide members that have paid"
                    onSwitchChange={
                        () => {
                            setFilterPaid(!filterPaid);
                        }
                    }
                />
            </HStack>
            <DataTable
                columns={columns}
                data={filteredBills as Bill[]}
                customStyles={dataTableStyles()}
                onRowClicked={
                    (row: Bill) => {
                        setSelectedBill(row);
                        onOpen();
                    }
                }
                fixedHeaderScrollHeight="300px"
                highlightOnHover
                pagination
                paginationPerPage={50}
                paginationRowsPerPageOptions={[50, (allBillsData?.length || 999)]}
                responsive
                striped
                subHeaderWrap
                defaultSortFieldId={1}
            />
            <AppModal size="lg" isOpen={isOpen} onClose={onClose} contentProps={{ padding: 3 }}>
                <Heading>
                    {`Billing detail for ${selectedBill?.membershipAdmin} - ${selectedBill?.year}`}
                </Heading>
                <Text size="x-small">{`Bill ID: ${selectedBill?.billId}`}</Text>
                <BillingStatsDisplay bill={selectedBill} />
                <WrappedSwitchInput
                    wrapperText="Contacted and renewing?"
                    // eslint-disable-next-line max-len
                    defaultChecked={(selectedBill?.contactedAndRenewing) || (selectedBill?.curYearPaid && selectedBill.curYearIns) || false}
                    onSwitchChange={
                        async () => {
                            // eslint-disable-next-line no-empty
                            if (selectedBill?.billId) {
                                await markContactedAndRenewing(state.token, selectedBill?.billId);
                                getMembershipBillData();
                            }
                        }
                    }
                    toastMessage={`${selectedBill?.firstName} ${selectedBill?.lastName} tagged as renewing.`}
                    maxWidth={400}
                />
                <WrappedSwitchInput
                    wrapperText="Mark (or unmark) as paid"
                    defaultChecked={selectedBill?.curYearPaid || false}
                    onSwitchChange={
                        async () => {
                            if (selectedBill?.billId) {
                                await payBill(state.token, selectedBill?.billId, paymentMethod);
                                await markContactedAndRenewing(state.token, selectedBill?.billId);
                                getMembershipBillData();
                            }
                        }
                    }
                    toastMessage={`${selectedBill?.firstName} ${selectedBill?.lastName} marked as paid.`}
                    maxWidth={400}
                />
                {
                    selectedBill?.curYearPaid && selectedBill.paymentMethod && (
                        <a href={`${selectedBill.squareLink}`} target="_blank" rel="noreferrer">
                            {`Paid via ${selectedBill?.paymentMethod}`}
                        </a>
                    )
                }
                {
                    !selectedBill?.curYearPaid && (
                        <Box maxWidth={175}>
                            <NativeSelect.Root>
                                <NativeSelect.Field
                                    placeholder="Payment Method"
                                    size="sm"
                                    onChange={
                                        (event) => {
                                            setPaymentMethod(event.target.value);
                                        }
                                    }
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Check">Check</option>
                                    <option value="PayPal">PayPal</option>
                                    <option value="Square">Square</option>
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
                        </Box>
                    )
                }
                <WrappedSwitchInput
                    wrapperText="Mark (or unmark) as insurance submitted"
                    defaultChecked={selectedBill?.curYearIns || false}
                    onSwitchChange={
                        async () => {
                            if (selectedBill?.billId) {
                                await attestInsurance(state.token, selectedBill?.billId);
                                getMembershipBillData();
                                if (selectedBill.amount === 0) {
                                    await markContactedAndRenewing(state.token, selectedBill?.billId);
                                }
                            }
                        }
                    }
                    locked={selectedBill?.curYearIns}
                    toastMessage={`${selectedBill?.firstName} ${selectedBill?.lastName} paperwork complete.`}
                    maxWidth={400}
                />
                <HStack mt={2} mr={3}>
                    <Button
                        colorPalette="orange"
                        disabled={selectedBill?.curYearPaid}
                        onClick={
                            async () => {
                                await payBill(state.token, selectedBill?.billId || 0, 'Discounted');
                                await getMembershipBillData();
                                onClose();
                            }
                        }
                    >
                        Discount 100%
                        <BsCashCoin />
                    </Button>
                    <Button
                        colorPalette="orange"
                        disabled={selectedBill?.curYearPaid}
                        onClick={
                            async () => {
                                await discountBill(state.token, selectedBill?.billId || 0);
                                await getMembershipBillData();
                                onClose();
                            }
                        }
                    >
                        Discount 50%
                        <BsCashCoin />
                    </Button>
                </HStack>
                <Text
                    fontSize="sm"
                >
                    Once insurance is attested, this checkbox locks so contact support if you need to undo it.
                </Text>
                <Alert.Root status="warning">
                    <Link
                        fontSize="sm"
                        href={`sms:${selectedBill?.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {`Text at ${selectedBill?.phone}`}
                    </Link>
                    <Link
                        fontSize="sm"
                        href={`mailto:${selectedBill?.membershipAdminEmail}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {`Email at ${selectedBill?.membershipAdminEmail}`}
                    </Link>
                    <Link
                        fontSize="sm"
                        href={`tel:${selectedBill?.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {`Call at ${selectedBill?.phone}`}
                    </Link>
                </Alert.Root>
                <Button
                    mt={10}
                    variant="outline"
                    size="lg"
                    bgColor="orange.300"
                    width={150}
                    color="white"
                    onClick={
                        () => {
                            onClose();
                        }
                    }
                >
                    Close
                </Button>
            </AppModal>
        </VStack>
    );
}
