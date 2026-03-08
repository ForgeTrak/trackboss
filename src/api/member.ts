import { Request, Response, Router } from 'express';
import PDFDocument from 'pdfkit';

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
            logger.error('Error adding new member', e);
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
            logger.error(`Error at path ${req.path}`);
            logger.error(e);
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
            logger.error(`Error at path ${req.path}`);
            logger.error(e);

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
            logger.error(`Error at path ${req.path}`);
            logger.error(e);

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
            logger.error(`Error at path ${req.path}`);
            logger.error(e);

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
        logger.error(`Error at path ${req.path}`);
        logger.error(e);
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
            await logAuditEvent(req, 'Member', memberId, 'PATCH', prePatchMember, updatedMember);
            response = updatedMember;
            // if it's a family member ("member") and inactivated, then delete the cognito user
            // and the member record.  This is just cleanup stuff. and may change later.
            if (!updatedMember.active && (updatedMember.memberType === 'Member')) {
                try {
                    const removeCount = await deleteFamilyMember(updatedMember.memberId, req.user.tenantId);
                    const userEmail = updatedMember.email;
                    logger.info(`Removed ${removeCount} rows for user ${updatedMember.email}`);
                    if (updatedMember.email) {
                        // use this loathesome promises hipster syntax here because I want this to run
                        // asychronously so the UI doesn't wait 5 seconds for the cognito delete to work.
                        deleteCognitoUser(updatedMember.uuid)
                            .then((
                                () => {
                                    logger.info(`Deactivated Cognito user for ${userEmail}`);
                                }))
                            .catch((error) => {
                                // eslint-disable-next-line max-len
                                logger.error(`Error deleting Cognito user ${userEmail}.  User will be abandoned in Cognito.`);
                                logger.error(error);
                            });
                    }
                } catch (error: any) {
                    logger.error('Error deleting user from database. Something is probably really wrong!');
                    logger.error(error);
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
                logger.info(`${updatedMember.firstName} ${updatedMember.lastName} set to Former member, reason code ${req.body.deactivationReason}`);
                // not all members have users, especially older ones who are still in our data, so check for dat.
                if (updatedMember.uuid) {
                    deleteCognitoUser(updatedMember.uuid)
                        .then((
                            () => {
                                logger.info(`Deactivated Cognito user for ${updatedMember.email}`);
                            }))
                        .catch((error) => {
                            // eslint-disable-next-line max-len
                            logger.error(`Error deleting Cognito user ${updatedMember.email}.  User will be abandoned in Cognito.`);
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
                            logger.info(`Changed user email for ${updatedMember.memberId} to ${updatedMember.email}`);
                        }
                    ))
                    .catch((error) => {
                        logger.error(`Error updating Cognito user email for member ID ${updatedMember.memberId}.`);
                        logger.error('As a result their login is probably broken now.');
                        logger.error(error);
                    });
            }
            res.status(200);
        } catch (e: any) {
            logger.error(`Error at path ${req.path}`);
            logger.error(e);

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
        const workbook = startWorkbook(workbookTitle);
        const worksheet = workbook.getWorksheet(1);
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
        logger.error(`Error at path ${req.path}`);
        logger.error(error);
        res.status(500);
        res.send(error);
    }
});

member.get('/card/create/:memberId', async (req: Request, res: Response) => {
    const { memberId } = req.params;
    const authorization = req.query.id as string;
    logger.info(`Generating membership card for ${memberId}`);
    const headerCheck = checkHeader(`Bearer ${authorization}`);
    if (!headerCheck.valid) {
        res.status(401);
    } else {
        logger.info('Generating membership card - verifying token.');
        await verify(headerCheck.token, 'Member', Number(memberId));
        const memberForCard = await getMember(memberId, req.user.tenantId);
        const boardMembers = await getBoardMemberList(req.user.tenantId, new Date().getFullYear().toString());
        const president = boardMembers.find((m) => m.title === 'President');

        logger.info('Generating membership card - got all card data.');

        // Create a PDF document
        const doc = new PDFDocument();

        // Set response headers for PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename=PRAmembershipCard.pdf');

        // Pipe the PDF content to the response stream
        doc.pipe(res);
        // Draw border around the page
        const borderWidth = 100;
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;

        // Top border
        doc.moveTo(0, 0).lineTo(pageWidth, 0).lineWidth(borderWidth).stroke();

        // Right border
        doc.moveTo(pageWidth, 0).lineTo(pageWidth, pageHeight).lineWidth(borderWidth).stroke();

        // Bottom border
        doc.moveTo(pageWidth, pageHeight).lineTo(0, pageHeight).lineWidth(borderWidth).stroke();

        // Left border
        doc.moveTo(0, pageHeight).lineTo(0, 0).lineWidth(borderWidth).stroke();

        doc.image('src/assets/logo512.png');
        const signatureFontPath = 'src/assets/fonts/GreatVibes-Regular.ttf';

        // Add content to the PDF with the custom font
        doc.font('Helvetica');
        doc.fontSize(24).text(`Palmyra Racing Association Member - ${new Date().getFullYear()}`);
        doc.fontSize(14).text(`${memberForCard.firstName} ${memberForCard.lastName}`);
        doc.fontSize(14).text(`Member id ${memberForCard.memberId}, Membership Id ${memberForCard.membershipId}`);
        doc.fontSize(14).text(`Primary member ${memberForCard.membershipAdmin}`);
        doc.fontSize(14).text(memberForCard.membershipType);
        doc.fontSize(14).text('');
        doc.font(signatureFontPath).fontSize(24).text(`${president?.firstName} ${president?.lastName}`);
        doc.font('Helvetica');
        doc.fontSize(12).text('President, Palmyra Racing Association');
        logger.info('Generating membership card - Card generated, sending to front end.');

        // Finalize the PDF
        doc.end();
        logger.info('Generating membership card - card genertion completed and sent to front end.');
    }
});

member.put('/resetpassword/:memberId', async (req: Request, res: Response) => {
    try {
        await validateAdminAccess(req, res);
        const { memberId } = req.params;
        const memberForReset = await getMember(memberId, req.user.tenantId);
        const defaultResetValue = await getDefaultSettingValue('USER_DEFAULT_PW', req.user.tenantId);
        // fire and forget, the back to the UI immediately so this call isn't slow.
        resetCognitoPassword(memberForReset, defaultResetValue);
        res.send({
            member: memberForReset.email,
            value: defaultResetValue,
        });
    } catch (error) {
        logger.error(`Error at path ${req.path}`);
        logger.error(error);
        res.status(500);
        res.send(error);
    }
});

export default member;
