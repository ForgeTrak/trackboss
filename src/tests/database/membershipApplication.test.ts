jest.mock('../../database/pool');
const { mockQuery } = require('../../database/pool') as { mockQuery: jest.Mock };

import {
    applicationExistsForEmail,
    getMembershipApplication,
    getMembershipApplications,
    insertMembershipApplication,
    updateApplicationStatus,
} from '../../database/membershipApplication';

describe('database/membershipApplication', () => {
    beforeEach(() => mockQuery.mockReset());

    const appJson = { firstName: 'F', lastName: 'L', email: 'e@x.com' };
    const appRow = {
        membership_application_id: 1,
        tenant_id: 't',
        application_json: appJson,
        application_email: 'e@x.com',
        application_status: 'pending',
        application_notes_internal: '',
        application_notes_shared: '',
        application_priority: 0,
    };

    it('insertMembershipApplication returns insertId', async () => {
        mockQuery.mockResolvedValueOnce([{ insertId: 9 } as any]);
        await expect(
            insertMembershipApplication({ email: 'a@b.com', tenantId: 't' } as any),
        ).resolves.toBe(9);
    });

    it('getMembershipApplications maps rows', async () => {
        mockQuery.mockResolvedValueOnce([[appRow]]);
        const list = await getMembershipApplications(2026, 't');
        expect(list[0].email).toBe('e@x.com');
    });

    it('getMembershipApplication returns one', async () => {
        mockQuery.mockResolvedValueOnce([[appRow]]);
        const a = await getMembershipApplication(1, 't');
        expect(a.firstName).toBe('F');
    });

    it('applicationExistsForEmail is true when rows', async () => {
        mockQuery.mockResolvedValueOnce([[{ id: 1 }]]);
        await expect(applicationExistsForEmail('e@x.com')).resolves.toBe(true);
    });

    it('applicationExistsForEmail is false when empty', async () => {
        mockQuery.mockResolvedValueOnce([[]]);
        await expect(applicationExistsForEmail('none@x.com')).resolves.toBe(false);
    });

    it('updateApplicationStatus updates and reloads', async () => {
        mockQuery
            .mockResolvedValueOnce([{ affectedRows: 1 } as any])
            .mockResolvedValueOnce([[appRow]]);
        const u = await updateApplicationStatus(1, 'accepted', 'int', 'app', 't');
        expect(u.status).toBe('pending');
    });
});
