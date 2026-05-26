import React, { useContext } from 'react';
import { Tabs } from '@chakra-ui/react';

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
                {
                    state.user &&
                    <GeneralInfo user={state.user} />
                }
            </Tabs.Content>
            <Tabs.Content value="family">
                {
                    state.user && (
                        <FamilyAndBikes
                            admin={state.user.memberType.includes('Admin')}
                        />
                    )
                }
            </Tabs.Content>
            <Tabs.Content value="workpoints">
                <WorkPointsHistory />
            </Tabs.Content>
            <Tabs.Content value="dues">
                <DuesAndWaivers />
            </Tabs.Content>
        </Tabs.Root>
    );
}
