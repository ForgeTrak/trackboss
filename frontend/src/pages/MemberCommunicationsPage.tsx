import React from 'react';
import { Box } from '@chakra-ui/react';
import Header from '../components/Header';
import CommunicationsList from '../components/CommunicationsList';

function MemberCommunicationsPage() {
    return (
        <>
            <Header title="Member Communications" activeButtonId={5} />
            <Box mt={0} pt={0} />
            <CommunicationsList />
        </>
    );
}

export default MemberCommunicationsPage;
