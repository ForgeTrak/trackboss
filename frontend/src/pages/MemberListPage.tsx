import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { HiCog, HiUsers } from 'react-icons/hi';
import { FaStream } from 'react-icons/fa';

import theme from '../theme';
import Header from '../components/Header';
import MemberList from '../components/MemberList';
import BoardMemberList from '../components/BoardMemberList';
import CustomTabPanel from '../components/shared/CustomTabPanel';
import PointsLeaderboard from '../components/tabpanels/PointsLeaderBoard';

function MemberListPage() {
    return (
        <ChakraProvider theme={theme}>
            <Header title="Members" activeButtonId={3} />
            <CustomTabPanel
                tabs={
                    [
                        { label: 'Points Leaders', icon: <FaStream /> },
                        { label: 'Members', icon: <HiUsers /> },
                        { label: 'Board Members', icon: <HiCog /> },
                    ]
                }
                panels={
                    [
                        <PointsLeaderboard />,
                        <MemberList />,
                        <BoardMemberList />,
                    ]
                }
            />
        </ChakraProvider>
    );
}

export default MemberListPage;
