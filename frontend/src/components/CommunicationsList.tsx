import React, { useContext, useEffect, useState } from 'react';
import { Button, VStack } from '@chakra-ui/react';
import DataTable from 'react-data-table-component';

import { useAppDisclosure } from '../hooks/useAppDisclosure';
import { MemberCommunication } from '../../../src/typedefs/memberCommunication';
import { MembershipTag } from '../../../src/typedefs/membershipTag';

import { getCommunications } from '../controller/communication';
import { UserContext } from '../contexts/UserContext';
import { getUniqueTags } from '../controller/membershipTags';

import dataTableStyles from './shared/DataTableStyles';
import CreateCommunicationModal from './modals/CreateCommunicationModal';
import ViewCommunicationModal from './modals/ViewCommunicationModal';

export default function CommunicationsList() {
    const { state } = useContext(UserContext);
    const [allCommunications, setAllCommunications] = useState<MemberCommunication[]>();
    const [uniqueTags, setUniqueTags] = useState<MembershipTag[]>();
    const [selectedCommunication, setSelectedCommunication] = useState<MemberCommunication>();

    const { isOpen, onClose, onOpen } = useAppDisclosure();
    const { isOpen: isViewOpen, onClose: onViewClose, onOpen: onViewOpen } = useAppDisclosure();

    async function initCommunicationsData() {
        const allCommunicationsData = await getCommunications(state.token);
        setAllCommunications(allCommunicationsData);
        const allTags = await getUniqueTags(state.token);
        setUniqueTags(allTags);
    }

    useEffect(() => {
        initCommunicationsData();
    }, []);

    const columns: any = [
        {
            name: 'Subject',
            selector: (row: MemberCommunication) => row.subject,
            sortable: true,
            maxWidth: '10',
            id: 'subject',
        },
        {
            name: 'Sender',
            selector: (row: MemberCommunication) => row.senderName,
            sortable: true,
            maxWidth: '10',
            id: 'sender',
        },
        {
            name: 'Mechanism',
            selector: (row: MemberCommunication) => row.mechanism,
            sortable: true,
            maxWidth: '10',
            id: 'mechanism',
        },
        {
            name: 'Sent',
            selector: (row: MemberCommunication) => row.sentDate,
            sortable: true,
            id: 'sent',
        },
    ];

    return (
        <VStack mt={5} ml={5}>
            <Button
                backgroundColor="orange"
                color="white"
                onClick={
                    () => {
                        onOpen();
                    }
                }
            >
                New Communication
            </Button>
            <DataTable
                columns={columns}
                data={allCommunications as MemberCommunication[]}
                customStyles={dataTableStyles()}
                onRowClicked={
                    (row: MemberCommunication) => {
                        setSelectedCommunication(row);
                        onViewOpen();
                    }
                }
                fixedHeaderScrollHeight="300px"
                highlightOnHover
                pagination
                paginationPerPage={50}
                paginationRowsPerPageOptions={[50, (allCommunications?.length || 999)]}
                responsive
                striped
                subHeaderWrap
                defaultSortFieldId="sent"
                defaultSortAsc={false}
            />
            <CreateCommunicationModal
                isOpen={isOpen}
                onClose={onClose}
                addAction={() => initCommunicationsData()}
                tags={uniqueTags}
                userId={state.user?.memberId || 0}
                token={state.token}
            />
            <ViewCommunicationModal
                communication={selectedCommunication}
                isOpen={isViewOpen}
                onClose={onViewClose}
            />
        </VStack>
    );
}
