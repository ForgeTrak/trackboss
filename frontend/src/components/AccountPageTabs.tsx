import React, { useContext } from 'react';
import {
    Tabs,
    Tab,
    TabPanel,
    TabPanels,
    TabList,
} from '@chakra-ui/react';

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
        <Tabs variant="soft-rounded" bg="white" colorScheme="orange" isLazy lazyBehavior="keepMounted">
            <TabList>
                <Tab>
                    General Info &nbsp;
                    <BsWrench />
                </Tab>
                <Tab>
                    Family & Bikes &nbsp;
                    <BsFillPeopleFill />
                </Tab>
                <Tab>
                    Work Point History &nbsp;
                    <IoMdBriefcase />
                </Tab>
                <Tab>
                    Dues & Waivers &nbsp;
                    <FaMoneyBillAlt />
                </Tab>
            </TabList>
            <TabPanels>
                <TabPanel>
                    {
                        state.user &&
                        <GeneralInfo user={state.user} />
                    }
                </TabPanel>
                <TabPanel>
                    {
                        state.user && (
                            <FamilyAndBikes
                                admin={state.user.memberType.includes('Admin')}
                            />
                        )
                    }
                </TabPanel>
                <TabPanel>
                    <WorkPointsHistory />
                </TabPanel>
                <TabPanel>
                    <DuesAndWaivers />
                </TabPanel>
            </TabPanels>
        </Tabs>
    );
}
