import React from 'react';
import { Box, Tabs } from '@chakra-ui/react';
import TabData from './TabData';

interface CustomTabsProps {
    tabs: TabData[]; // Labels for the tabs
    panels: React.ReactNode[]; // Content for each panel
}

export default function MemberSelector(props: CustomTabsProps) {
    const { tabs, panels } = props;
    return (
        <Tabs.Root
            variant="subtle"
            bg="white"
            colorPalette="orange"
            lazyMount
            defaultValue={tabs[0]?.label.toLowerCase()}
            paddingLeft={3}
        >
            <Tabs.List fontSize="md">
                {
                    tabs.map((tab) => (
                        // eslint-disable-next-line react/no-array-index-key
                        (
                            <Tabs.Trigger rounded="md" value={tab.label.toLowerCase()} key={tab.label.toLowerCase()}>
                                {tab.label}
                                {tab.icon}
                            </Tabs.Trigger>
                        )
                    ))
                }
            </Tabs.List>
            {
                panels.map((panel, index) => {
                    // eslint-disable-next-line react/no-array-index-key
                    const tabContent = (
                        <Tabs.Content
                            value={tabs[index]?.label.toLowerCase()}
                            // eslint-disable-next-line react/no-array-index-key
                            key={index}
                        >
                            <Box padding="2">
                                {panel}
                            </Box>
                        </Tabs.Content>
                    );
                    return tabContent;
                })
            }
        </Tabs.Root>
    );
}
