import React from 'react';
import { Box } from '@chakra-ui/react';
import Header from '../components/Header';
import BoardMemberList from '../components/BoardMemberList';

function BoardMemberListPage() {
    return (
        <>
            <Header title="Board Members" activeButtonId={5} />
            <Box mt={0} pt={0}>
                <BoardMemberList />
            </Box>
        </>
    );
}

export default BoardMemberListPage;
