import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CustomTabPanel from '../../../components/shared/CustomTabPanel';
import TabData from '../../../components/shared/TabData';

const mockTabs: TabData[] = [
    { label: 'Tab 1', icon: <span>📝</span> },
    { label: 'Tab 2', icon: <span>📊</span> },
    { label: 'Tab 3' },
];

const mockPanels = [
    <div key="panel1">Panel 1 Content</div>,
    <div key="panel2">Panel 2 Content</div>,
    <div key="panel3">Panel 3 Content</div>,
];

describe('CustomTabPanel', () => {
    it('renders tabs correctly with labels and icons', () => {
        render(<CustomTabPanel tabs={mockTabs} panels={mockPanels} />);

        expect(screen.getByText('Tab 1')).toBeInTheDocument();
        expect(screen.getByText('📝')).toBeInTheDocument();
        expect(screen.getByText('Tab 2')).toBeInTheDocument();
        expect(screen.getByText('📊')).toBeInTheDocument();
        expect(screen.getByText('Tab 3')).toBeInTheDocument();
    });

    it('renders panels correctly', () => {
        render(<CustomTabPanel tabs={mockTabs} panels={mockPanels} />);

        // With isLazy, only the active panel is rendered initially
        expect(screen.getByText('Panel 1 Content')).toBeInTheDocument();
        expect(screen.queryByText('Panel 2 Content')).not.toBeInTheDocument();

        // Click Tab 2 to render its panel
        fireEvent.click(screen.getByText('Tab 2'));
        expect(screen.getByText('Panel 2 Content')).toBeInTheDocument();

        // Click Tab 3 to render its panel
        fireEvent.click(screen.getByText('Tab 3'));
        expect(screen.getByText('Panel 3 Content')).toBeInTheDocument();

        // With lazyBehavior="keepMounted", previously rendered panels stay in the DOM
        expect(screen.getByText('Panel 1 Content')).toBeInTheDocument();
        expect(screen.getByText('Panel 2 Content')).toBeInTheDocument();
    });

    it('renders tabs without icons', () => {
        const tabsWithoutIcons = [
            { label: 'Simple Tab' },
        ];
        const panelsWithoutIcons = [
            <div key="simple">Simple Panel</div>,
        ];

        render(<CustomTabPanel tabs={tabsWithoutIcons} panels={panelsWithoutIcons} />);

        expect(screen.getByText('Simple Tab')).toBeInTheDocument();
        expect(screen.getByText('Simple Panel')).toBeInTheDocument();
    });

    it('renders with empty tabs and panels', () => {
        render(<CustomTabPanel tabs={[]} panels={[]} />);

        expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('applies correct Chakra UI props', () => {
        render(<CustomTabPanel tabs={mockTabs} panels={mockPanels} />);

        const tabsContainer = screen.getByRole('tablist').parentElement;
        expect(tabsContainer).toHaveClass('chakra-tabs');
    });

    it('uses correct tab variant and color scheme', () => {
        render(<CustomTabPanel tabs={mockTabs} panels={mockPanels} />);

        const tabsContainer = screen.getByRole('tablist').parentElement;
        expect(tabsContainer).toBeInTheDocument();
    });
});
