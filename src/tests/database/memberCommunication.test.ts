jest.mock('../../database/pool');
const { mockQuery } = require('../../database/pool') as { mockQuery: jest.Mock };

import {
    getMemberCommunicationById,
    getMemberCommunications,
    insertMemberCommunication,
} from '../../database/memberCommunication';

describe('database/memberCommunication', () => {
    beforeEach(() => mockQuery.mockReset());

    const row = {
        member_communication_id: 1,
        tenant_id: 't',
        subject: 'S',
        mechanism: 'email',
        sender_id: 2,
        sender_name: 'L, F',
        text: 'Hi',
        selected_tags: '[]',
        creation_date: '2026-01-01T00:00:00.000Z',
        recipients: '[]',
    };

    it('getMemberCommunications maps rows', async () => {
        mockQuery.mockResolvedValueOnce([[row]]);
        const list = await getMemberCommunications('t');
        expect(list[0].memberCommunicationId).toBe(1);
        expect(list[0].senderName).toBe('L, F');
    });

    it('getMemberCommunicationById returns one object', async () => {
        mockQuery.mockResolvedValueOnce([[row]]);
        const one = await getMemberCommunicationById(1, 't');
        expect(one.subject).toBe('S');
        expect(one.members).toBe('[]');
    });

    it('insertMemberCommunication inserts and reloads', async () => {
        mockQuery
            .mockResolvedValueOnce([{ insertId: 9 } as any])
            .mockResolvedValueOnce([[{ ...row, member_communication_id: 9 }]]);
        const comm = await insertMemberCommunication(
            {
                subject: 'Sub',
                senderId: 1,
                text: 'Body',
                mechanism: 'email',
                members: [],
                selectedTags: [],
            } as any,
            't',
        );
        expect(comm.memberCommunicationId).toBe(9);
    });
});
