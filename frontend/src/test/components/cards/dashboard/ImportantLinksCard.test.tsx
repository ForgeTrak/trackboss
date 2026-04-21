import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AppProvider from '../../../../components/AppProvider';
import ImportantLinksCard from '../../../../components/cards/dashboard/ImportantLinksCard';

function renderWithProviders(ui: React.ReactElement) {
    return render(<AppProvider>{ui}</AppProvider>);
}

describe('ImportantLinksCard', () => {
    it('renders the title', () => {
        renderWithProviders(
            <ImportantLinksCard
                dashboardLinks={[]}
                memberId={1}
                jwt="token-abc"
            />,
        );

        expect(screen.getByRole('heading', { name: /club info and links/i })).toBeInTheDocument();
    });

    it('renders dashboard links from props', () => {
        renderWithProviders(
            <ImportantLinksCard
                dashboardLinks={
                    [
                        {
                            linkId: 1,
                            tenantId: 't1',
                            linkTitle: 'Member Rules',
                            linkUrl: 'https://example.com/rules',
                            linkDisplayOrder: 1,
                        },
                    ]
                }
                memberId={1}
                jwt="x"
            />,
        );

        const rules = screen.getByRole('link', { name: /member rules/i });
        expect(rules).toHaveAttribute('href', 'https://example.com/rules');
    });
});
