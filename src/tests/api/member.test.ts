import request from 'supertest';
import { checkHeader, validateAdminAccess, verify } from '../../util/auth';
import {
    deleteFamilyMember,
    getEligibleVoters,
    getMember,
    getMemberByEmail,
    getMemberByPhone,
    getMemberList,
    getMembersWithTag,
    insertMember,
    patchMember,
} from '../../database/member';
import { markMembershipFormer } from '../../database/membership';
import { getBoardMemberList } from '../../database/boardMember';
import { getDefaultSettingValue } from '../../database/defaultSettings';
import member from '../../api/member';
import { createJsonRouterApp } from './testUtils';

/** Captures Express `res` passed to `doc.pipe(res)` so `doc.end()` can finish the HTTP response in tests. */
const mockPdfPipeTarget: { res: unknown } = { res: undefined };

jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));
jest.mock('../../util/cognito', () => ({
    deleteCognitoUser: jest.fn().mockResolvedValue(undefined),
    updateCognitoUserEmail: jest.fn().mockResolvedValue(undefined),
    resetCognitoPassword: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../database/member');
jest.mock('../../database/membership');
jest.mock('../../database/boardMember');
jest.mock('../../database/defaultSettings');
jest.mock('../../excel/workbookHelper', () => ({
    startWorkbook: jest.fn(() => ({ getWorksheet: () => ({ columns: [], addRow: jest.fn() }) })),
    formatWorkbook: jest.fn(),
    httpOutputWorkbook: jest.fn((_wb: unknown, res: any) => {
        res.status(200);
        res.end();
    }),
}));

jest.mock('../../database/auditLog', () => ({
    __esModule: true,
    default: jest.fn(),
    getAuditLogById: jest.fn(),
    getAuditLogByTenant: jest.fn(),
}));

const mockedCheckHeader = checkHeader as jest.MockedFunction<typeof checkHeader>;
const mockedVerify = verify as jest.MockedFunction<typeof verify>;
const mockedGetMemberList = getMemberList as jest.MockedFunction<typeof getMemberList>;
const mockedGetMember = getMember as jest.MockedFunction<typeof getMember>;
const mockedInsertMember = insertMember as jest.MockedFunction<typeof insertMember>;
const mockedValidateAdmin = validateAdminAccess as jest.MockedFunction<typeof validateAdminAccess>;
const mockedPatchMember = patchMember as jest.MockedFunction<typeof patchMember>;
const mockedMembersWithTag = getMembersWithTag as jest.MockedFunction<typeof getMembersWithTag>;
const mockedByPhone = getMemberByPhone as jest.MockedFunction<typeof getMemberByPhone>;
const mockedByEmail = getMemberByEmail as jest.MockedFunction<typeof getMemberByEmail>;
const mockedDeleteFamily = deleteFamilyMember as jest.MockedFunction<typeof deleteFamilyMember>;
const mockedMarkFormer = markMembershipFormer as jest.MockedFunction<typeof markMembershipFormer>;
const mockedEligible = getEligibleVoters as jest.MockedFunction<typeof getEligibleVoters>;
const mockedBoardList = getBoardMemberList as jest.MockedFunction<typeof getBoardMemberList>;
const mockedDefaultPw = getDefaultSettingValue as jest.MockedFunction<typeof getDefaultSettingValue>;

describe('api/member', () => {
    const app = createJsonRouterApp('/m', member);

    beforeEach(() => {
        jest.clearAllMocks();
        mockPdfPipeTarget.res = undefined;
        mockedValidateAdmin.mockResolvedValue({} as any);
    });

    it('returns 401 on /list without auth', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
        const res = await request(app).get('/m/list');
        expect(res.status).toBe(401);
    });

    it('POST /new returns 401 when header invalid', async () => {
        mockedCheckHeader.mockReturnValue({ valid: false, reason: 'x', token: '' });
        const res = await request(app).post('/m/new').send({ firstName: 'A' });
        expect(res.status).toBe(401);
    });

    it('POST /new maps verify errors', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockRejectedValueOnce(new Error('Authorization Failed'));
        let res = await request(app).post('/m/new').set('Authorization', 'Bearer t').send({});
        expect(res.status).toBe(401);
        mockedVerify.mockRejectedValueOnce(new Error('Forbidden'));
        res = await request(app).post('/m/new').set('Authorization', 'Bearer t').send({});
        expect(res.status).toBe(403);
    });

    it('returns member list', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetMemberList.mockResolvedValue([] as any);
        const res = await request(app).get('/m/list').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedGetMemberList).toHaveBeenCalledWith({}, 'tenant-test');
    });

    it('POST /new as Membership Admin', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedInsertMember.mockResolvedValue(12);
        mockedGetMember.mockResolvedValue({ memberId: 12 } as any);
        const res = await request(app).post('/m/new').set('Authorization', 'Bearer t').send({ firstName: 'A' });
        expect(res.status).toBe(201);
        expect(mockedInsertMember).toHaveBeenCalledWith({ firstName: 'A' }, 'tenant-test');
    });

    it('returns one member by id', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetMember.mockResolvedValue({ memberId: 3 } as any);
        const res = await request(app).get('/m/3').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('returns 400 for invalid role on list', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        const res = await request(app).get('/m/list?role=notARealRole').set('Authorization', 'Bearer t');
        expect(res.status).toBe(400);
    });

    it('returns 400 for invalid membershipId on list', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        const res = await request(app).get('/m/list?membershipId=abc').set('Authorization', 'Bearer t');
        expect(res.status).toBe(400);
    });

    it('returns list filtered by tag', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedMembersWithTag.mockResolvedValue([] as any);
        const res = await request(app).get('/m/list?tag=vip').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedMembersWithTag).toHaveBeenCalledWith('vip');
    });

    it('returns member by phone', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedByPhone.mockResolvedValue({ memberId: 1 } as any);
        const res = await request(app).get('/m/phone/555').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('returns member by email path', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedByEmail.mockResolvedValue({ memberId: 2 } as any);
        const res = await request(app).get('/m/email/a%40b.com').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('GET email exists reflects active flag', async () => {
        mockedByEmail.mockResolvedValue({ active: true } as any);
        const res = await request(app).get('/m/email/exists/x%40y.com');
        expect(res.status).toBe(200);
        expect(res.body.exists).toBe(true);
    });

    it('PATCH /:memberId updates member', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetMember
            .mockResolvedValueOnce({ memberId: 5, active: true, memberType: 'Admin' } as any)
            .mockResolvedValueOnce({ memberId: 5, active: true, memberType: 'Admin' } as any);
        mockedPatchMember.mockResolvedValue(undefined as any);
        const res = await request(app).patch('/m/5').set('Authorization', 'Bearer t').send({ firstName: 'Z' });
        expect(res.status).toBe(200);
    });

    it('PATCH deactivating Member type triggers family cleanup path', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetMember
            .mockResolvedValueOnce({ memberId: 6, active: true, memberType: 'Member', email: 'e@e.com', uuid: 'u1' } as any)
            .mockResolvedValueOnce({
                memberId: 6,
                active: false,
                memberType: 'Member',
                email: 'e@e.com',
                uuid: 'u1',
            } as any);
        mockedPatchMember.mockResolvedValue(undefined as any);
        mockedDeleteFamily.mockResolvedValue(1 as any);
        const res = await request(app).patch('/m/6').set('Authorization', 'Bearer t').send({ active: false });
        expect(res.status).toBe(200);
    });

    it('PATCH deactivating membership admin marks membership former', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetMember
            .mockResolvedValueOnce({
                memberId: 7,
                active: true,
                memberType: 'Membership Admin',
                membershipAdminId: 7,
                membershipId: 10,
                uuid: 'u2',
            } as any)
            .mockResolvedValueOnce({
                memberId: 7,
                active: false,
                memberType: 'Membership Admin',
                membershipAdminId: 7,
                membershipId: 10,
                email: 'a@a.com',
                uuid: 'u2',
            } as any);
        mockedPatchMember.mockResolvedValue(undefined as any);
        mockedMarkFormer.mockResolvedValue(10 as any);
        const res = await request(app)
            .patch('/m/7')
            .set('Authorization', 'Bearer t')
            .send({ active: false, deactivationReason: 'moved' });
        expect(res.status).toBe(200);
    });

    it('GET list voter eligibility excel for admin', async () => {
        mockedEligible.mockResolvedValue([
            {
                lastName: 'L',
                firstName: 'F',
                membershipType: 'Associate Member',
                meetingsAttended: 1,
                percentageMeetings: '50',
                pointsEarned: 1,
                eligibleByPoints: 'Yes',
                eligibleByMeetings: 'Yes',
            },
            {
                lastName: 'X',
                firstName: 'Y',
                membershipType: 'Full Member',
                meetingsAttended: 2,
                percentageMeetings: '80',
                pointsEarned: 5,
                eligibleByPoints: 'Yes',
                eligibleByMeetings: 'No',
            },
        ] as any);
        const res = await request(app).get('/m/list/voterEligibility/excel').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    it('PUT resetpassword triggers cognito reset', async () => {
        mockedGetMember.mockResolvedValue({ memberId: 8, email: 'p@p.com' } as any);
        mockedDefaultPw.mockResolvedValue('temp' as any);
        const res = await request(app).put('/m/resetpassword/8').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(res.body.member).toBe('p@p.com');
    });

    it('GET /:memberId returns 404 when not found', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetMember.mockRejectedValue(new Error('not found'));
        const res = await request(app).get('/m/404').set('Authorization', 'Bearer t');
        expect(res.status).toBe(404);
    });

    it('GET list returns 500 on unexpected list errors', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetMemberList.mockRejectedValue(new Error('db'));
        const res = await request(app).get('/m/list').set('Authorization', 'Bearer t');
        expect(res.status).toBe(500);
    });

    it('PATCH returns 400 on user input error', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetMember.mockResolvedValue({ memberId: 9, active: true, memberType: 'Admin' } as any);
        mockedPatchMember.mockRejectedValue(new Error('user input error'));
        const res = await request(app).patch('/m/9').set('Authorization', 'Bearer t').send({});
        expect(res.status).toBe(400);
    });

});
