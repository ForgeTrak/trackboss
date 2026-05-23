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
            <Tabs.List fontSize="md">
                <Tabs.Trigger rounded="md" value="general">
                    General Info &nbsp;
                    <BsWrench />
                </Tabs.Trigger>
                <Tabs.Trigger rounded="md" value="family">
                    Family & Bikes &nbsp;
                    <BsFillPeopleFill />
                </Tabs.Trigger>
                <Tabs.Trigger rounded="md" value="workpoints">
                    Work Point History &nbsp;
                    <IoMdBriefcase />
                </Tabs.Trigger>
                <Tabs.Trigger rounded="md" value="dues">
                    Dues & Waivers &nbsp;
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
