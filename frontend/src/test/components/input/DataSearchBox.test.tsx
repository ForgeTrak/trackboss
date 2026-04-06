import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AppProvider from '../../../components/AppProvider';
import DataSearchBox from '../../../components/input/DataSearchBox';

function renderWithProviders(ui: React.ReactElement) {
    return render(<AppProvider>{ui}</AppProvider>);
}

function DataSearchBoxHarness() {
    const [searchValue, setSearchValue] = useState('');
    return (
        <DataSearchBox searchValue={searchValue} onTextChange={setSearchValue} />
    );
}

describe('DataSearchBox', () => {
    it('shows the current search value and lowercases input as the user types', async () => {
        const user = userEvent.setup();

        renderWithProviders(<DataSearchBoxHarness />);

        const field = screen.getByPlaceholderText('Search...');
        expect(field).toHaveValue('');

        await user.type(field, 'Hello');
        expect(field).toHaveValue('hello');
    });

    it('clears the search when the clear control is clicked', async () => {
        const user = userEvent.setup();
        const onTextChange = vi.fn();

        const { container } = renderWithProviders(
            <DataSearchBox searchValue="abc" onTextChange={onTextChange} />,
        );

        const field = screen.getByPlaceholderText('Search...');
        expect(field).toHaveValue('abc');

        const rightSlot = container.querySelector('.chakra-input__right-element');
        expect(rightSlot).toBeTruthy();
        await user.click(rightSlot as HTMLElement);

        expect(onTextChange).toHaveBeenCalledWith('');
    });
});
