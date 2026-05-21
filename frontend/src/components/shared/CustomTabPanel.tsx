import React from 'react';
import { Tabs } from '@chakra-ui/react';
import TabData from './TabData';

interface CustomTabsProps {
    tabs: TabData[]; // Labels for the tabs
    panels: React.ReactNode[]; // Content for each panel
}

export default function MemberSelector(props: CustomTabsProps) {
    const { tabs, panels } = props;
    return (
        <Tabs.Root variant="subtle" bg="white" colorPalette="orange" lazyMount defaultValue={tabs[0]?.label.toLowerCase()}>
            <Tabs.List>
                {
                    tabs.map((tab) => (
                        // eslint-disable-next-line react/no-array-index-key
                        (
                            <Tabs.Trigger value={tab.label.toLowerCase()} key={tab.label.toLowerCase()}>
                                {tab.label}
                                {tab.icon}
                            </Tabs.Trigger>
                        )
                    ))
                }
            </Tabs.List>
            {
                panels.map((panel, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    (<Tabs.Content value={tabs[index]?.label.toLowerCase()} key={index}>{panel}</Tabs.Content>)
                ))
            }
        </Tabs.Root>
    );
}
