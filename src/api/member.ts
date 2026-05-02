import { Request, Response, Router } from 'express';

import { checkHeader, validateAdminAccess, verify } from '../util/auth';
import {
    deleteFamilyMember,
    getEligibleVoters,
    getMember, getMemberByEmail, getMemberByPhone, getMemberList,
    getMembersWithTag,
    insertMember, MEMBER_TYPE_MAP, patchMember,
} from '../database/member';
import {
    GetMemberListFilters,
    GetMemberListResponse,
    GetMemberResponse,
    Member,
    PatchMemberResponse,
    PostNewMemberResponse,
} from '../typedefs/member';
import logger from '../logger';
import { deleteCognitoUser, updateCognitoUserEmail, resetCognitoPassword } from '../util/cognito';
import { formatWorkbook, httpOutputWorkbook, startWorkbook } from '../excel/workbookHelper';
import { markMembershipFormer } from '../database/membership';
import { getBoardMemberList } from '../database/boardMember';
import { getDefaultSettingValue } from '../database/defaultSettings';
import logAuditEvent from '../database/auditLog';

const member = Router();

member.post('/new', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PostNewMemberResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token, 'Membership Admin');
            const insertId = await insertMember(req.body, req.user.tenantId);
            response = await getMember(`${insertId}`, req.user.tenantId);
            res.status(201);
        } catch (e: any) {
            logger.error('member - Error adding new member', e);
            if (e.message === 'user input error') {
                res.status(400);
                response = { reason: 'bad request' };
            } else if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else if (e.message === 'Forbidden') {
                res.status(403);
                response = { reason: 'forbidden' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

member.get('/list', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetMemberListResponse;
    const headerCheck = checkHeader(authorization);
    const tagParam = req.query.tag as string;
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const filterRole: string | undefined = req.query.role as string;
            const membershipFilter: string | undefined = req.query.membershipId as string;
            const membershipNum = Number(membershipFilter);
            const filters: GetMemberListFilters = {};
            if (!MEMBER_TYPE_MAP.has(filterRole) && typeof filterRole !== 'undefined') {
                res.status(400);
                response = { reason: 'invalid role specified' };
            } else if (Number.isNaN(membershipNum) && typeof membershipFilter !== 'undefined') {
                res.status(400);
                response = { reason: 'invalid membership id' };
            } else if (tagParam) {
                const list = await getMembersWithTag(tagParam);
                res.status(200);
                response = list;
            } else {
                if (typeof filterRole !== 'undefined') {
                    filters.type = filterRole;
                }
                if (typeof membershipFilter !== 'undefined') {
                    filters.membershipId = membershipNum;
                }
                const memberList: Member[] = await getMemberList(filters, req.user.tenantId);
                res.status(200);
                response = memberList;
            }
        } catch (e: any) {
            logger.error(`member - Error at path ${req.path}, e`);
            if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

member.get('/:memberId', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetMemberResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const { memberId } = req.params;
            response = await getMember(memberId, req.user.tenantId);
            res.status(200);
        } catch (e: any) {
            logger.error(`member - Error at path ${req.path}`, e);

            if (e.message === 'not found') {
                res.status(404);
                response = { reason: 'not found' };
            } else if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

member.get('/phone/:phoneNumber', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetMemberResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const { phoneNumber } = req.params;
            response = await getMemberByPhone(phoneNumber, req.user.tenantId);
            res.status(200);
        } catch (e: any) {
            logger.error(`member - Error at path ${req.path}`, e);

            if (e.message === 'not found') {
                res.status(404);
                response = { reason: 'not found' };
            } else if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

member.get('/email/:email', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetMemberResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const { email } = req.params;
            response = await getMemberByEmail(email, req.user.tenantId);
            res.status(200);
        } catch (e: any) {
            logger.error(`member - Error at path ${req.path}`, e);

            if (e.message === 'not found') {
                res.status(404);
                response = { reason: 'not found' };
            } else if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

member.get('/email/exists/:email', async (req: Request, res: Response) => {
    const response = {
        exists: false,
    };
    try {
        const { email } = req.params;
        const foundMember = await getMemberByEmail(email);
        response.exists = (foundMember.active === true);
        res.status(200);
    } catch (e: any) {
        logger.error(`member - Error at path ${req.path}`, e);
    }
    res.send(response);
});

member.patch('/:memberId', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PatchMemberResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            const { memberId } = req.params;
            await verify(headerCheck.token, 'Membership Admin', Number(memberId));
            const prePatchMember = await getMember(memberId, req.user.tenantId);
            await patchMember(memberId, req.body, req.user.tenantId);
            const updatedMember = await getMember(memberId, req.user.tenantId);
            await logAuditEvent(req, 'Member', memberId, prePatchMember, updatedMember);
            response = updatedMember;
            // if it's a family member ("member") and inactivated, then delete the cognito user
            // and the member record.  This is just cleanup stuff. and may change later.
            if (!updatedMember.active && (updatedMember.memberType === 'Member')) {
                try {
                    const removeCount = await deleteFamilyMember(updatedMember.memberId, req.user.tenantId);
                    const userEmail = updatedMember.email;
                    logger.info(`member - Removed ${removeCount} rows for user ${updatedMember.email}`);
                    if (updatedMember.email) {
                        // use this loathesome promises hipster syntax here because I want this to run
                        // asychronously so the UI doesn't wait 5 seconds for the cognito delete to work.
                        deleteCognitoUser(updatedMember.uuid)
                            .then((
                                () => {
                                    logger.info(`member - Deactivated Cognito user for ${userEmail}`);
                                }))
                            .catch((error) => {
                                // eslint-disable-next-line max-len
                                logger.error(`member - Error deleting Cognito user ${userEmail}.  User will be abandoned in Cognito.`);
                                logger.error(error);
                            });
                    }
                } catch (error: any) {
                    // eslint-disable-next-line max-len
                    logger.error('member - Error deleting user from database. Something is probably really wrong!', error);
                }
            }
            if (!updatedMember.active && (updatedMember.memberId === updatedMember.membershipAdminId)) {
                // if this is the membership admin then we are de-activating the whole membership.
                // Set Membership to former
                const id = await markMembershipFormer(
                    updatedMember.membershipId,
                    req.body.deactivationReason || '',
                    req.user.tenantId,
                );
                // eslint-disable-next-line max-len
                logger.info(`member - ${updatedMember.firstName} ${updatedMember.lastName} set to Former member, reason code ${req.body.deactivationReason}`);
                // not all members have users, especially older ones who are still in our data, so check for dat.
                if (updatedMember.uuid) {
                    deleteCognitoUser(updatedMember.uuid)
                        .then((
                            () => {
                                logger.info(`member - Deactivated Cognito user for ${updatedMember.email}`);
                            }))
                        .catch((error) => {
                            // eslint-disable-next-line max-len
                            logger.error(`member - Error deleting Cognito user ${updatedMember.email}.  User will be abandoned in Cognito.`);
                            logger.error(error);
                        });
                }
            }
            if (updatedMember.email) {
                // more loathesome hipster garbage for dealing with cognito's slowness.  Not sure which I like less -
                // nested hipster promise syntax, or slow back ends that require it.  probably a tie.
                updateCognitoUserEmail(updatedMember)
                    .then((
                        () => {
                            // eslint-disable-next-line max-len
                            logger.info(`member - Changed user email for ${updatedMember.memberId} to ${updatedMember.email}`);
                        }
                    ))
                    .catch((error) => {
                        // eslint-disable-next-line max-len
                        logger.error(`member - Error updating Cognito user email for member ID ${updatedMember.memberId}.`);
                        logger.error('member - As a result their login is probably broken now.', error);
                    });
            }
            res.status(200);
        } catch (e: any) {
            logger.error(`member - Error at path ${req.path}`, e);

            if (e.message === 'user input error') {
                res.status(400);
                response = { reason: 'bad request' };
            } else if (e.message === 'not found') {
                res.status(404);
                response = { reason: 'not found' };
            } else if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else if (e.message === 'Forbidden') {
                res.status(403);
                response = { reason: 'forbidden' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

member.get('/list/voterEligibility/excel', async (req: Request, res: Response) => {
    try {
        await validateAdminAccess(req, res);
        const rightNow = new Date();
        const eligibleVoters = await getEligibleVoters(rightNow.getFullYear());
        const workbookTitle = `Eligible Voters ${new Date().toLocaleDateString().replace(/\//gi, '-')}`;
        const { workbook, worksheet } = startWorkbook(workbookTitle);
        worksheet.columns = [
            { header: 'Last Name', key: 'lastName', width: 10 },
            { header: 'First Name', key: 'firstName', width: 15 },
            { header: 'Membership Type', key: 'membershipType', width: 15 },
            { header: 'Meetings Attended', key: 'meetingsAttended', width: 6 },
            { header: '% of meetings', key: 'percentageMeetings', width: 6 },
            { header: 'Points Earned', key: 'pointsEarned', width: 6 },
            { header: 'Eligible?', key: 'eligible', width: 6 },
            { header: 'Eligible By Points', key: 'eligibleByPoints', width: 6 },
            { header: 'Eligible By Meetings', key: 'eligibleByMeetings', width: 6 },
        ];
        eligibleVoters.forEach((voter: any) => {
            let isEligible;
            if (voter.membershipType === 'Associate Member') {
                isEligible = ((voter.eligibleByPoints === 'Yes') && (voter.eligibleByMeetings === 'Yes'));
            } else {
                isEligible = ((voter.eligibleByPoints === 'Yes') || (voter.eligibleByMeetings === 'Yes'));
            }
            const row = {
                lastName: voter.lastName,
                firstName: voter.firstName,
                membershipType: voter.membershipType,
                meetingsAttended: voter.meetingsAttended,
                percentageMeetings: voter.percentageMeetings,
                pointsEarned: voter.pointsEarned,
                eligible: isEligible ? 'Yes' : 'No',
                eligibleByPoints: voter.eligibleByPoints,
                eligibleByMeetings: voter.eligibleByMeetings,
            };
            worksheet.addRow(row);
        });
        formatWorkbook(worksheet);
        // write workbook to buffer.
        httpOutputWorkbook(workbook, res, `members${new Date().getTime()}`);
    } catch (error) {
        logger.error(`member - Error at path ${req.path}`, error);
        res.status(500);
        res.send(error);
    }
});

member.put('/resetpassword/:memberId', async (req: Request, res: Response) => {
    try {
        await validateAdminAccess(req, res);
        const { memberId } = req.params;
        const memberForReset = await getMember(memberId, req.user.tenantId);
        const defaultResetValue = await getDefaultSettingValue('USER_DEFAULT_PW', req.user.tenantId);
        logger.info(`member - Resetting password for ${memberForReset.email} to default value.`);
        // fire and forget, the back to the UI immediately so this call isn't slow.
        resetCognitoPassword(memberForReset, defaultResetValue);
        res.send({
            member: memberForReset.email,
            value: defaultResetValue,
        });
    } catch (error) {
        logger.error(`member - Error at path ${req.path}`, error);
        res.status(500);
        res.send(error);
    }
});

export default member;
