import React from 'react';
import { describe, it, expect } from 'vitest';
import TabData from '../../../components/shared/TabData';

describe('TabData', () => {
    it('can be instantiated with minimal properties', () => {
        const tabData: TabData = {
            label: 'Test Tab',
        };

        expect(tabData.label).toBe('Test Tab');
        expect(tabData.icon).toBeUndefined();
    });

    it('can be instantiated with all properties', () => {
        const mockIcon = <span>📝</span>;
        const tabData: TabData = {
            label: 'Test Tab',
            icon: mockIcon,
        };

        expect(tabData.label).toBe('Test Tab');
        expect(tabData.icon).toBe(mockIcon);
    });

    it('allows icon to be any React node', () => {
        const stringIcon = '📊';
        const componentIcon = <div>Icon</div>;
        const nullIcon = null;

        const tabWithString: TabData = {
            label: 'String Icon',
            icon: stringIcon,
        };

        const tabWithComponent: TabData = {
            label: 'Component Icon',
            icon: componentIcon,
        };

        const tabWithNull: TabData = {
            label: 'Null Icon',
            icon: nullIcon,
        };

        expect(tabWithString.icon).toBe(stringIcon);
        expect(tabWithComponent.icon).toBe(componentIcon);
        expect(tabWithNull.icon).toBe(nullIcon);
    });

    it('has correct type structure', () => {
        const tabData: TabData = {
            label: 'Type Test',
            icon: <span>Test</span>,
        };

        // TypeScript should enforce these types
        expect(typeof tabData.label).toBe('string');
        expect(tabData.icon).toBeDefined();
    });

    it('can be used in arrays', () => {
        const tabs: TabData[] = [
            { label: 'Tab 1' },
            { label: 'Tab 2', icon: <span>📝</span> },
            { label: 'Tab 3', icon: <span>📊</span> },
        ];

        expect(tabs).toHaveLength(3);
        expect(tabs[0].label).toBe('Tab 1');
        expect(tabs[0].icon).toBeUndefined();
        expect(tabs[1].label).toBe('Tab 2');
        expect(tabs[1].icon).toBeDefined();
        expect(tabs[2].label).toBe('Tab 3');
        expect(tabs[2].icon).toBeDefined();
    });

    it('maintains immutability', () => {
        const originalTab: TabData = {
            label: 'Original',
            icon: <span>Original</span>,
        };

        const modifiedTab = { ...originalTab, label: 'Modified' };

        expect(originalTab.label).toBe('Original');
        expect(modifiedTab.label).toBe('Modified');
        expect(modifiedTab.icon).toBe(originalTab.icon);
    });
});
