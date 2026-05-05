import React from 'react';
import {
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    TabsProps,
} from '@chakra-ui/react';
import TabData from './TabData';

interface CustomTabsProps extends Omit<TabsProps, 'children'> {
    tabs: TabData[]; // Labels for the tabs
    panels: React.ReactNode[]; // Content for each panel
}

export default function MemberSelector(props: CustomTabsProps) {
    const { tabs, panels } = props;
    return (
        <Tabs variant="soft-rounded" bg="white" colorScheme="orange" isLazy lazyBehavior="keepMounted">
            <TabList>
                {
                    tabs.map((tab) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <Tab key={tab.label.toLowerCase()}>
                            {tab.label}
                            &nbsp;
                            {tab.icon}
                        </Tab>
                    ))
                }
            </TabList>
            <TabPanels>
                {
                    panels.map((panel, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <TabPanel key={index}>{panel}</TabPanel>
                    ))
                }
            </TabPanels>
        </Tabs>
    );
}
