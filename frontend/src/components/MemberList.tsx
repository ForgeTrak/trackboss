import {
    Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel,
    Center, HStack, SimpleGrid, Stat, StatLabel, StatNumber, useDisclosure,
} from '@chakra-ui/react';
import _ from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import { ErrorResponse } from '../../../src/typedefs/errorResponse';
import { Member } from '../../../src/typedefs/member';
import { MemberType } from '../../../src/typedefs/memberType';
import { UserContext } from '../contexts/UserContext';
import { getAllBoardMembersForCurrentYear } from '../controller/boardMember';
import { getMemberList } from '../controller/member';
import { getMembershipTypeCounts } from '../controller/memberType';
import DataSearchBox from './input/DataSearchBox';
import MemberSummaryModal from './MemberSummaryModal';
import WrappedSwitchInput from './input/WrappedSwitchInput';

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

export default function MemberList() {
    const [selectedMember, setSelectedMember] = useState<Member>();
    const [cells, setCells] = useState<Member[]>([]);
    const [allCells, setAllCells] = useState<Member[]>([]);
    const [membershipCounts, setMembershipCounts] = useState<MemberType[]>([]);
    const [totalMemberships, setTotalMemberships] = useState<number>(0);

    const { state } = useContext(UserContext);
    const [error, setError] = useState<ErrorResponse | undefined>(undefined);
    const [dirty, setDirty] = useState<boolean>(false);
    const { onClose, isOpen, onOpen } = useDisclosure({ onClose: () => setDirty((oldDirty) => !oldDirty) });
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [showActive, setShowActive] = useState<boolean>(true);
    const columns: any = [
        {
            name: 'Last Name',
            selector: (row: Member) => row.lastName,
            sortable: true,
        },
        {
            name: 'First Name',
            selector: (row: Member) => row.firstName,
            sortable: true,
        },
        {
            name: 'Membership Type',
            selector: (row: Member) => row.membershipType,
            sortable: true,
        },
        {
            name: 'Role',
            selector: (row: Member) => row.memberType,
            sortable: true,
            omit: !showActive,
        },
        {
            name: 'Deactivated',
            selector: (row: Member) => row.lastModifiedDate,
            sortable: true,
            omit: showActive,
        },
    ];
    useEffect(() => {
        async function getData() {
            const c: Member[] | ErrorResponse = await getMemberList(state.token);
            const boardMembers = await getAllBoardMembersForCurrentYear(state.token);
            if ('reason' in c) {
                setError(c);
            } else {
                if ('reason' in boardMembers) {
                    // do nothing, an error here isn't a big deal, it just means we can't show baord member data
                } else {
                    _.forEach(boardMembers, (boardMember) => {
                        _.forEach(c, (member: Member) => {
                            if (member.memberId === boardMember.memberId) {
                                member.membershipType = `Board Member - ${boardMember.title}(${member.membershipType})`;
                                member.boardMemberData = boardMember;
                                return false;
                            }
                            return true;
                        });
                    });
                }
                let activeMembers = _.filter(c, (member) => (member.active === showActive));
                // only show membership admins on this page, where the memberId and the admin ID is the same because
                // they ARE the admin.
                activeMembers = activeMembers.filter((member) => (member.memberId === member.membershipAdminId));
                setCells(activeMembers);
                setAllCells(activeMembers);
                setTotalMemberships(activeMembers.length);
                setError(undefined);
            }
        }
        getData();
    }, [dirty, showActive]);

    useEffect(() => {
        if (searchTerm === '') {
            setCells(allCells);
        } else {
            const newCells =
                allCells.filter((cell: any) => {
                    const firstNameFound = cell.firstName.toLowerCase().includes(searchTerm);
                    const lastNameFound = cell.lastName.toLowerCase().includes(searchTerm);
                    const typeFound = cell.membershipType?.toLowerCase().includes(searchTerm);
                    const phoneNumberFound = cell.phoneNumber.includes(searchTerm);
                    return (firstNameFound || lastNameFound || typeFound || phoneNumberFound);
                });
            setCells(newCells);
        }
    }, [searchTerm, allCells]);

    useEffect(() => {
        async function getData() {
            const counts = await getMembershipTypeCounts(state.token);
            // sort in reverse order. This || 0 nonsense is because .type is optional.  It will never be
            // undefined in this context so this just gets eslint to stop complaining.
            counts.sort((a, b) => ((b.count || 0) - (a.count || 0)));
            setMembershipCounts(counts);
        }
        getData();
    }, []);
    if (error) {
        return (
            <div>
                {error.reason}
            </div>
        );
    }
    return (
        <div>
            <Accordion allowToggle maxWidth="75%">
                <AccordionItem>
                    <AccordionButton>
                        {`${totalMemberships} total memberships (click for detailed view)`}
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                        <SimpleGrid columns={[3, null, 6]} m={5}>
                            {
                                membershipCounts.map((membershipType) => (
                                    <Stat>
                                        <StatLabel>{membershipType.type}</StatLabel>
                                        <StatNumber>{membershipType.count}</StatNumber>
                                    </Stat>
                                ))
                            }
                        </SimpleGrid>
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
            <HStack align="center">
                <DataSearchBox
                    searchValue={searchTerm}
                    onTextChange={setSearchTerm}
                />
                {
                    state.user?.memberType === 'Admin' && (
                        <Center>
                            <WrappedSwitchInput
                                wrapperText="Show inactive members?"
                                duration={1000}
                                defaultChecked={!showActive}
                                toastMessage={`Showing ${!showActive ? 'active' : 'inactive'} memberships`}
                                maxWidth={600}
                                onSwitchChange={
                                    () => {
                                        setShowActive(!showActive);
                                        setDirty(true);
                                    }
                                }
                            />
                        </Center>
                    )
                }
            </HStack>
            <DataTable
                columns={columns}
                data={cells}
                fixedHeaderScrollHeight="300px"
                highlightOnHover
                pagination
                paginationPerPage={100}
                paginationRowsPerPageOptions={[100, 200, cells.length]}
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
                onRowClicked={
                    (row: Member) => {
                        setSelectedMember(row);
                        onOpen();
                    }
                }
            />
            {
                selectedMember && (
                    <MemberSummaryModal
                        isOpen={isOpen}
                        onClose={onClose}
                        memberInfo={selectedMember}
                    />
                )
            }
        </div>
    );
}
