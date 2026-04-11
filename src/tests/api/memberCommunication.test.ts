import request from 'supertest';
import { validateAdminAccess } from '../../util/auth';
import {
    getMemberCommunicationById,
    getMemberCommunications,
    insertMemberCommunication,
} from '../../database/memberCommunication';
import { getMemberList, getMembersWithTag } from '../../database/member';
import { getBoardMemberList } from '../../database/boardMember';
import { getEnvironmentParameter } from '../../util/environmentWrapper';
import memberCommunication from '../../api/memberCommunication';
import { createJsonRouterApp } from './testUtils';

jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));
jest.mock('../../database/memberCommunication');
jest.mock('../../database/member');
jest.mock('../../database/boardMember');
jest.mock('../../util/environmentWrapper', () => ({
    getEnvironmentParameter: jest.fn(),
    getConnectionObject: jest.fn().mockResolvedValue({}),
}));
jest.mock('../../database/auditLog', () => ({
    __esModule: true,
    default: jest.fn(),
    getAuditLogById: jest.fn(),
    getAuditLogByTenant: jest.fn(),
}));
const mockSqsSendMessage = jest.fn((_p: unknown, cb: (e: Error | null, r?: { MessageId: string }) => void) => {
    cb(null, { MessageId: 'mid' });
});
jest.mock('aws-sdk', () => ({
    config: { update: jest.fn() },
    SQS: jest.fn().mockImplementation(() => ({
        sendMessage: (...args: unknown[]) => (mockSqsSendMessage as any)(...args),
    })),
}));

const mockedValidate = validateAdminAccess as jest.MockedFunction<typeof validateAdminAccess>;
const mockedGetAll = getMemberCommunications as jest.MockedFunction<typeof getMemberCommunications>;
const mockedGetOne = getMemberCommunicationById as jest.MockedFunction<typeof getMemberCommunicationById>;
const mockedInsert = insertMemberCommunication as jest.MockedFunction<typeof insertMemberCommunication>;
const mockedMemberList = getMemberList as jest.MockedFunction<typeof getMemberList>;
const mockedWithTag = getMembersWithTag as jest.MockedFunction<typeof getMembersWithTag>;
const mockedBoardList = getBoardMemberList as jest.MockedFunction<typeof getBoardMemberList>;
const mockedEnv = getEnvironmentParameter as jest.MockedFunction<typeof getEnvironmentParameter>;

describe('api/memberCommunication', () => {
    const app = createJsonRouterApp('/mc', memberCommunication);

    beforeEach(() => {
        jest.clearAllMocks();
        mockedValidate.mockResolvedValue({} as any);
    });

    it('returns all communications for admin', async () => {
        mockedGetAll.mockResolvedValue([] as any);
        const res = await request(app).get('/mc/').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedGetAll).toHaveBeenCalledWith('tenant-test');
    });

    it('returns one communication', async () => {
        mockedGetOne.mockResolvedValue({ id: 1 } as any);
        const res = await request(app).get('/mc/9').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedGetOne).toHaveBeenCalledWith(9, 'tenant-test');
    });

    it('POST / creates communication for subscribed members and enqueues SQS', async () => {
        mockedMemberList.mockResolvedValue([
            {
                memberId: 1,
                active: true,
                subscribed: true,
                firstName: 'A',
                lastName: 'B',
                email: 'a@b.com',
                phoneNumber: '555',
            },
        ] as any);
        mockedBoardList.mockResolvedValue([] as any);
        mockedInsert.mockResolvedValue({
            memberCommunicationId: 10,
            subject: 'S',
            mechanism: 'EMAIL',
        } as any);
        mockedEnv.mockResolvedValueOnce('us-east-1').mockResolvedValueOnce('123');
        const res = await request(app)
            .post('/mc/')
            .set('Authorization', 'Bearer t')
            .send({ mechanism: 'EMAIL', subject: 'S', text: '<p>x</p>', selectedTags: [] });
        expect(res.status).toBe(200);
        expect(mockedInsert).toHaveBeenCalled();
    });

    it('POST / logs when SQS sendMessage fails', async () => {
        mockSqsSendMessage.mockImplementationOnce((_p: unknown, cb: (e: Error | null) => void) => {
            cb(new Error('queue down'));
        });
        mockedMemberList.mockResolvedValue([
            {
                memberId: 1,
                active: true,
                subscribed: true,
                firstName: 'A',
                lastName: 'B',
                email: 'a@b.com',
                phoneNumber: '1',
            },
        ] as any);
        mockedBoardList.mockResolvedValue([] as any);
        mockedInsert.mockResolvedValue({
            memberCommunicationId: 20,
            subject: 'S',
            mechanism: 'EMAIL',
        } as any);
        mockedEnv.mockResolvedValueOnce('us-east-1').mockResolvedValueOnce('123');
        const res = await request(app)
            .post('/mc/')
            .set('Authorization', 'Bearer t')
            .send({ mechanism: 'EMAIL', subject: 'S', text: 'x', selectedTags: [] });
        expect(res.status).toBe(200);
        mockSqsSendMessage.mockImplementation((_p: unknown, cb: (e: null, r: { MessageId: string }) => void) => {
            cb(null, { MessageId: 'mid' });
        });
    });

    it('POST / expands recipients from selected tags', async () => {
        mockedWithTag.mockResolvedValue([
            {
                memberId: 2,
                firstName: 'T',
                lastName: 'G',
                email: 't@g.com',
                phoneNumber: '1',
            },
        ] as any);
        mockedInsert.mockResolvedValue({
            memberCommunicationId: 11,
            subject: 'S',
            mechanism: 'TEXT',
        } as any);
        mockedEnv.mockResolvedValueOnce('us-east-1').mockResolvedValueOnce('123');
        const res = await request(app)
            .post('/mc/')
            .set('Authorization', 'Bearer t')
            .send({
                mechanism: 'TEXT',
                subject: 'S',
                text: 'hello',
                selectedTags: ['board'],
            });
        expect(res.status).toBe(200);
        expect(mockedWithTag).toHaveBeenCalledWith('board');
    });
});
