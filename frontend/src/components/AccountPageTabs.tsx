import React, { useContext } from 'react';
import { Box, Tabs } from '@chakra-ui/react';

import { BsWrench, BsFillPeopleFill } from 'react-icons/bs';
import { FaMoneyBillAlt } from 'react-icons/fa';
import { IoMdBriefcase } from 'react-icons/io';
import { UserContext } from '../contexts/UserContext';
import GeneralInfo from './GeneralInfo';
import FamilyAndBikes from './FamilyAndBikes';
import WorkPointsHistory from './WorkPointsHistory';
import DuesAndWaivers from './DuesAndWaivers';

export default function AccountPageTabs() {
    const { state } = useContext(UserContext);

    return (
        <Tabs.Root variant="subtle" bg="white" colorPalette="orange" lazyMount defaultValue="general">
            <Tabs.List fontSize="md" flexWrap="wrap" overflow="visible">
                <Tabs.Trigger rounded="md" value="general" gap="1" alignItems="center" whiteSpace="nowrap">
                    General Info
                    <BsWrench />
                </Tabs.Trigger>
                <Tabs.Trigger rounded="md" value="family" gap="1" alignItems="center" whiteSpace="nowrap">
                    Family & Bikes
                    <BsFillPeopleFill />
                </Tabs.Trigger>
                <Tabs.Trigger rounded="md" value="workpoints" gap="1" alignItems="center" whiteSpace="nowrap">
                    Work Point History
                    <IoMdBriefcase />
                </Tabs.Trigger>
                <Tabs.Trigger rounded="md" value="dues" gap="1" alignItems="center" whiteSpace="nowrap">
                    Dues & Waivers
                    <FaMoneyBillAlt />
                </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="general">
                <Box padding={2}>
                    {
                        state.user &&
                        <GeneralInfo user={state.user} />
                    }
                </Box>
            </Tabs.Content>
            <Tabs.Content value="family">
                <Box padding={2}>
                    {
                        state.user && (
                            <FamilyAndBikes
                                admin={state.user.memberType.includes('Admin')}
                            />
                        )
                    }
                </Box>
            </Tabs.Content>
            <Tabs.Content value="workpoints">
                <Box padding={2}>
                    <WorkPointsHistory />
                </Box>
            </Tabs.Content>
            <Tabs.Content value="dues">
                <Box padding={2}>
                    <DuesAndWaivers />
                </Box>
            </Tabs.Content>
        </Tabs.Root>
    );
}
