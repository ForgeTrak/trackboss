import request from 'supertest';
import { checkHeader, verify } from '../../util/auth';
import {
    applicationExistsForEmail,
    getMembershipApplication,
    getMembershipApplications,
    insertMembershipApplication,
    updateApplicationStatus,
} from '../../database/membershipApplication';
import { generateBill, getBill, getWorkPointThreshold } from '../../database/billing';
import { getMembershipType } from '../../database/memberType';
import { getMember, insertMember, patchMember } from '../../database/member';
import { insertMembership } from '../../database/membership';
import membershipApplication from '../../api/membershipApplication';
import { createJsonRouterApp } from './testUtils';
import { generateSquareLinks } from '../../util/billing';

jest.mock('../../util/auth', () => ({
    checkHeader: jest.fn(),
    verify: jest.fn(),
    validateAdminAccess: jest.fn(),
}));
jest.mock('../../database/membershipApplication', () => ({
    applicationExistsForEmail: jest.fn(),
    getMembershipApplication: jest.fn(),
    getMembershipApplications: jest.fn(),
    insertMembershipApplication: jest.fn(),
    updateApplicationStatus: jest.fn(),
}));
jest.mock('../../database/member');
jest.mock('../../database/membership');
jest.mock('../../database/billing');
jest.mock('../../database/memberType');
jest.mock('../../util/billing', () => ({ generateSquareLinks: jest.fn() }));
jest.mock('../../util/email', () => ({
    sendAppConfirmationEmail: jest.fn().mockResolvedValue(undefined),
    sendAppRejectedEmail: jest.fn(),
    sendNewMemberEmail: jest.fn(),
}));
jest.mock('../../util/dateHelper', () => ({ calculateBillingYear: () => 2026 }));
jest.mock('../../excel/workbookHelper', () => ({
    startWorkbook: jest.fn(() => ({ workbook: {}, worksheet: { columns: [], addRow: jest.fn() } })),
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
const mockedExists = applicationExistsForEmail as jest.MockedFunction<typeof applicationExistsForEmail>;
const mockedInsert = insertMembershipApplication as jest.MockedFunction<typeof insertMembershipApplication>;
const mockedGetApps = getMembershipApplications as jest.MockedFunction<typeof getMembershipApplications>;
const mockedUpdateStatus = updateApplicationStatus as jest.MockedFunction<typeof updateApplicationStatus>;
const mockedGetApp = getMembershipApplication as jest.MockedFunction<typeof getMembershipApplication>;
const mockedGetMembershipType = getMembershipType as jest.MockedFunction<typeof getMembershipType>;
const mockedInsertMember = insertMember as jest.MockedFunction<typeof insertMember>;
const mockedPatchMember = patchMember as jest.MockedFunction<typeof patchMember>;
const mockedGetMember = getMember as jest.MockedFunction<typeof getMember>;
const mockedInsertMembership = insertMembership as jest.MockedFunction<typeof insertMembership>;
const mockedGenerateBill = generateBill as jest.MockedFunction<typeof generateBill>;
const mockedGetWorkPointThreshold = getWorkPointThreshold as jest.MockedFunction<typeof getWorkPointThreshold>;
const mockedGetBill = getBill as jest.MockedFunction<typeof getBill>;
const mockedGenerateSquareLinks = generateSquareLinks as jest.MockedFunction<typeof generateSquareLinks>;

describe('api/membershipApplication', () => {
    const app = createJsonRouterApp('/ma', membershipApplication);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('GET /exists/:email returns exists flag', async () => {
        mockedExists.mockResolvedValue(true);
        const res = await request(app).get('/ma/exists/a%40b.com');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ exists: true });
    });

    it('POST / creates application and sends confirmation', async () => {
        mockedInsert.mockResolvedValue(55);
        const body = { tenantId: 'tenant-test', firstName: 'A', lastName: 'B', city: 'C', state: 'ST' };
        const res = await request(app).post('/ma/').send(body);
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(55);
        expect(mockedInsert).toHaveBeenCalled();
    });

    it('GET / lists applications for admin', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetApps.mockResolvedValue([] as any);
        const res = await request(app).get('/ma/?year=2026').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
        expect(mockedGetApps).toHaveBeenCalledWith(2026, 'tenant-test');
    });

    it('POST / returns 500 when insert fails', async () => {
        mockedInsert.mockRejectedValue(new Error('db'));
        const res = await request(app).post('/ma/').send({ tenantId: 't', firstName: 'A', lastName: 'B', city: 'C', state: 'S' });
        expect(res.status).toBe(500);
    });

    it('POST /review/:id updates status for admin', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedUpdateStatus.mockResolvedValue({ id: 3, status: 'Review' } as any);
        const res = await request(app)
            .post('/ma/review/3')
            .set('Authorization', 'Bearer t')
            .send({ internalNotes: 'n', applicantNotes: 'a' });
        expect(res.status).toBe(200);
    });

    it('GET /list/excel builds workbook for admin', async () => {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({} as any);
        mockedGetApps.mockResolvedValue([
            {
                id: 1,
                lastName: 'L',
                firstName: 'F',
                birthDate: '2000-01-01',
                city: 'C',
                referredBy: 'R',
                familyMembers: [],
                status: 'Pending',
            },
        ] as any);
        const res = await request(app).get('/ma/list/excel?year=2026').set('Authorization', 'Bearer t');
        expect(res.status).toBe(200);
    });

    function stubSuccessfulAcceptPipeline(applicationId: number) {
        mockedCheckHeader.mockReturnValue({ valid: true, reason: '', token: 't' });
        mockedVerify.mockResolvedValue({ memberId: 42 } as any);
        mockedGetMembershipType.mockResolvedValue({
            memberTypeId: 3,
            baseDuesAmt: 150,
        } as any);
        mockedUpdateStatus.mockResolvedValue({
            id: applicationId,
            status: 'Accepted',
        } as any);
        mockedGetApp.mockResolvedValue({
            id: applicationId,
            firstName: 'Jane',
            lastName: 'Rider',
            phone: '555-0100',
            occupation: 'Engineer',
            email: 'jane@example.com',
            birthDate: '1988-03-20',
            address: '10 Track Rd',
            city: 'Palmyra',
            state: 'PA',
            zip: '17078',
            familyMembers: [],
        } as any);
        mockedInsertMember.mockResolvedValue(9001);
        mockedInsertMembership.mockResolvedValue(7001);
        mockedPatchMember.mockResolvedValue(undefined as any);
        mockedGetWorkPointThreshold.mockResolvedValue({ threshold: 12 } as any);
        mockedGenerateBill.mockResolvedValue(8002);
        mockedGenerateSquareLinks.mockResolvedValue(undefined as any);
        mockedGetBill.mockResolvedValue({ billId: 8002, membershipId: 7001 } as any);
        mockedGetMember.mockResolvedValue({ memberId: 9001, firstName: 'Jane' } as any);
    }

    it('POST /accept/:id runs full conversion pipeline (Associate Member)', async () => {
        stubSuccessfulAcceptPipeline(88);
        const res = await request(app)
            .post('/ma/accept/88')
            .set('Authorization', 'Bearer t')
            .send({ internalNotes: 'ok', applicantNotes: 'welcome' });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ id: 88, status: 'Accepted' });
        expect(mockedGetMembershipType).toHaveBeenCalledWith('tenant-test', 'Associate Member');
        expect(mockedUpdateStatus).toHaveBeenCalledWith(
            88,
            'Accepted',
            'ok',
            'welcome',
            'tenant-test',
        );
        expect(mockedGetApp).toHaveBeenCalledWith(88, 'tenant-test');
        expect(mockedInsertMember).toHaveBeenCalled();
        expect(mockedInsertMembership).toHaveBeenCalled();
        expect(mockedPatchMember).toHaveBeenCalledWith(
            '9001',
            expect.objectContaining({ membershipId: 7001, modifiedBy: 42 }),
            'tenant-test',
        );
        expect(mockedGenerateBill).toHaveBeenCalled();
        expect(mockedGenerateSquareLinks).toHaveBeenCalledWith(2026, 7001, 'tenant-test');
        expect(mockedGetBill).toHaveBeenCalledWith(8002, 'tenant-test');
        expect(mockedGetMember).toHaveBeenCalledWith('9001', 'tenant-test');
    });

    it('POST /accept/:id guest query uses Guest Member type and current year billing', async () => {
        stubSuccessfulAcceptPipeline(90);
        mockedGetMembershipType.mockResolvedValueOnce({
            memberTypeId: 5,
            baseDuesAmt: 50,
        } as any);

        const res = await request(app)
            .post('/ma/accept/90')
            .query({ guest: '1' })
            .set('Authorization', 'Bearer t')
            .send({ internalNotes: '', applicantNotes: '' });

        expect(res.status).toBe(200);
        expect(mockedGetMembershipType).toHaveBeenCalledWith('tenant-test', 'Guest Member');
        expect(mockedUpdateStatus).toHaveBeenCalledWith(
            90,
            'Guest',
            '',
            '',
            'tenant-test',
        );
        const currentYear = new Date().getFullYear();
        expect(mockedGetWorkPointThreshold).toHaveBeenCalledWith(currentYear, 'tenant-test');
    });

    it('POST /accept/:id adds family members when application lists dependents', async () => {
        stubSuccessfulAcceptPipeline(91);
        mockedGetApp.mockResolvedValue({
            id: 91,
            firstName: 'Pat',
            lastName: 'Parent',
            phoneNumber: '555-9999',
            occupation: 'x',
            email: 'pat@example.com',
            birthDate: '1985-01-10',
            address: '1 A',
            city: 'B',
            state: 'C',
            zip: '1',
            familyMembers: [
                { firstName: 'Kid', lastName: 'Minor', dob: new Date('2012-06-15T12:00:00Z') },
            ],
        } as any);
        mockedInsertMember
            .mockResolvedValueOnce(9101)
            .mockResolvedValueOnce(9102);

        const res = await request(app)
            .post('/ma/accept/91')
            .set('Authorization', 'Bearer t')
            .send({});

        expect(res.status).toBe(200);
        expect(mockedInsertMember.mock.calls.length).toBeGreaterThanOrEqual(2);
        const familyCall = mockedInsertMember.mock.calls.find((c) => (c[0] as any).memberTypeId === 9);
        expect(familyCall).toBeDefined();
        expect((familyCall![0] as any).membershipId).toBe(7001);
    });
});
