import { Request, Response, Router } from 'express';
import { parseISO, format, differenceInYears } from 'date-fns';
import { sendAppConfirmationEmail, sendAppRejectedEmail, sendNewMemberEmail } from '../util/email';
import {
    applicationExistsForEmail,
    getMembershipApplication, getMembershipApplications,
    insertMembershipApplication, updateApplicationStatus,
} from '../database/membershipApplication';
import {
    getMember,
    insertMember, patchMember,
} from '../database/member';

import logger from '../logger';
import { checkHeader, verify } from '../util/auth';
import { Member, PatchMemberRequest, PostNewMemberRequest } from '../typedefs/member';
import { MembershipApplication } from '../typedefs/membershipApplication';
import { PostNewMembershipRequest } from '../typedefs/membership';
import { insertMembership } from '../database/membership';
import { generateBill, getWorkPointThreshold } from '../database/billing';
import { getMembershipType } from '../database/memberType';
import { generateSquareLinks } from '../util/billing';
import { calculateBillingYear } from '../util/dateHelper';
import { formatWorkbook, httpOutputWorkbook, startWorkbook } from '../excel/workbookHelper';

const membershipApplication = Router();

/**
 * All in one function to validate administrative access for a given user token. This will throw
 * an error if the token is not valid.  Callers can call this and then process the rest of the endpoint normally, as
 * this is a "catch all" function that does the work so you don't have to.
 *
 */
async function validateAdminAccess(req: Request, res: Response) : Promise<any> {
    const { authorization } = req.headers;
    let token = {};
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        throw new Error(headerCheck.reason);
    } else {
        try {
            token = await verify(headerCheck.token, 'Admin');
        } catch (error: any) {
            logger.error('Error authorizing user token as admin', error);
            throw error;
        }
    }
    return token;
}

/**
 * Shared function to update the status in the database.  Yay reusablity!
 * @param req request
 * @param res response
 * @param status status
 */
const sendApplicationStatus = async (req: Request, res: Response, status: string) => {
    try {
        await validateAdminAccess(req, res);
    } catch (error) {
        logger.error('Error updating application status', error);
        res.status(500);
        res.send(error);
    }
    const id = parseInt(req.params.id, 10);
    const { internalNotes, applicantNotes } = req.body;
    const updatedApplication = await updateApplicationStatus(id, status, internalNotes, applicantNotes);
    res.send(updatedApplication);
};

membershipApplication.post('/', async (req: Request, res: Response) => {
    try {
        const application = req.body;
        application.receivedDate = (new Date()).toLocaleString('en-US');
        logger.info(`Application received at ${application.receivedDate} for ${application.lastName}`);
        // eslint-disable-next-line max-len
        application.googleLink = `https://www.google.com/search?q=${application.firstName}+${application.lastName}+${application.city}+${application.state}`;
        const insertId = await insertMembershipApplication(application);
        application.id = insertId;
        await sendAppConfirmationEmail(application);
        res.send(application);
    } catch (error: any) {
        logger.error(error);
        res.status(500);
        res.send(error);
    }
});

membershipApplication.get('/exists/:emailAddress', async (req: Request, res: Response) => {
    const applicationExists = {
        exists: false,
    };
    try {
        const applicantEmail = req.params.emailAddress;
        const exists = await applicationExistsForEmail(applicantEmail);
        applicationExists.exists = exists;
    } catch (error: any) {
        logger.error(error);
        res.status(500);
        res.send(error);
    }
    res.send(applicationExists);
});

membershipApplication.get('/', async (req: Request, res: Response) => {
    try {
        await validateAdminAccess(req, res);
        const { year } = req.query;
        const allApplications = await getMembershipApplications(parseInt(year as string, 10));
        res.send(allApplications);
    } catch (error: any) {
        logger.error(error);
        res.status(500);
        res.send('Unable to process application due to error');
    }
});

membershipApplication.post('/accept/:id', async (req: Request, res: Response) => {
    let newMemberId : number;
    try {
        const isGuest = req.query.guest;
        let applicationStatus = 'Accepted';
        let membershipType = 'Associate Member';
        const currentYear = (new Date()).getFullYear();
        let billingYear = calculateBillingYear();
        if (isGuest) {
            // Guests will be members for the current year only, and time limited.
            applicationStatus = 'Guest';
            membershipType = 'Guest Member';
            billingYear = currentYear;
        }
        const membershipInfo = await getMembershipType(req.user.tenantId, membershipType);
        const actingUser = await validateAdminAccess(req, res);
        await sendApplicationStatus(req, res, applicationStatus);
        // get the application, and convert the primary member to a member. This call will create a
        // Cognito user, and send an email to the user letting them know they have one.
        const application : MembershipApplication = await getMembershipApplication(Number(req.params.id));
        // phone number processing with valid country code etc.
        let phoneNumber = application.phone || application.phoneNumber;
        phoneNumber = phoneNumber.replace(/-/g, '');
        const newMemberJoinDate = new Date().toISOString().slice(0, 10).replace('T', ' ');
        const newMember : PostNewMemberRequest = {
            // Magic numberism warning: this means "Membership Admin", aka, the default account on a
            // membership.  At some point, need to go back and fix this nonsense.
            memberTypeId: 8,
            firstName: application.firstName,
            lastName: application.lastName,
            phoneNumber,
            occupation: application.occupation,
            email: application.email,
            birthdate: parseISO(application.birthDate).toISOString().slice(0, 10).replace('T', ' '),
            // when did they join? RIGHT FREAKING NOW THAT'S WHEN! :)
            dateJoined: newMemberJoinDate,
            modifiedBy: actingUser.memberId,
            subscribed: true,
            membershipType,
            dependentStatus: 'Primary',
        };
        const primaryMemberId = await insertMember(newMember, req.user.tenantId);
        newMemberId = primaryMemberId;
        const newMembership : PostNewMembershipRequest = {
            // Associate member. Magic numberism again.
            membershipTypeId: membershipInfo.memberTypeId,
            membershipAdminId: primaryMemberId,
            yearJoined: currentYear,
            address: application.address,
            city: application.city,
            state: application.state,
            zip: application.zip,
            modifiedBy: actingUser.memberId,
        };
        const newMembershipId = await insertMembership(newMembership, req.user.tenantId);
        const memberUpdate : PatchMemberRequest = {
            membershipId: newMembershipId,
            modifiedBy: actingUser.memberId,
            subscribed: true,
        };
        await patchMember(`${primaryMemberId}`, memberUpdate, req.user.tenantId);
        // now send a welcome email to the member.
        // await sendNewMemberEmail(application);
        const { threshold } = await getWorkPointThreshold(billingYear, req.user.tenantId);
        const billId = await generateBill({
            amount: membershipInfo.baseDuesAmt,
            amountWithFee: ((membershipInfo.baseDuesAmt) + (membershipInfo.baseDuesAmt * 0.0290) + 0.30),
            membershipId: newMembershipId,
            pointsEarned: 0,
            pointsThreshold: threshold,
            workDetail: [],
            billingYear,
        }, req.user.tenantId);
        await generateSquareLinks(billingYear, newMembershipId);
        // TODO: this really needs type checking, otherwise it is prone to typeos and speling erors can mess it up.
        application.familyMembers.forEach(async (familyMember) => {
            // set required fields
            const newMemberFamily = familyMember;
            newMemberFamily.memberTypeId = 9;
            newMemberFamily.membershipId = newMembershipId;
            newMemberFamily.occupation = '';
            // no email - they can add this later if they want access
            newMemberFamily.email = '';
            newMemberFamily.phoneNumber = phoneNumber;
            newMemberFamily.dateJoined = newMemberJoinDate;
            newMemberFamily.birthdate = format(new Date(familyMember.dob), 'yyyy-MM-dd');
            newMemberFamily.lastModifiedBy = actingUser.memberId;
            // now insert the new family member.
            await insertMember(newMemberFamily, req.user.tenantId);
        });
        logger.info(`Generated bill ${billId} for membership ${newMembershipId} - application converted to member.`);
        const newMemberRecord = await getMember(`${primaryMemberId}`, req.user.tenantId);
    } catch (error: any) {
        logger.error(error);
        res.status(500);
        res.send('Unable to process application due to error');
    }
});

membershipApplication.post('/reject/:id', async (req: Request, res: Response) => {
    try {
        // update the last_modified_date field in here.
        await sendApplicationStatus(req, res, 'Rejected');
        const application : MembershipApplication = await getMembershipApplication(Number(req.params.id));
        // send an email saying they were rejected, with the application_notes_shared as the primary
        // field in the email
        await sendAppRejectedEmail(application);
        res.json(application);
    } catch (error: any) {
        logger.error(error);
        res.status(500);
        res.send('Unable to process application due to error');
    }
});

membershipApplication.post('/review/:id', async (req: Request, res: Response) => {
    try {
        await sendApplicationStatus(req, res, 'Review');
    } catch (error: any) {
        logger.error(error);
        res.status(500);
        res.send('Unable to process application due to error');
    }
});

membershipApplication.get('/list/excel', async (req: Request, res: Response) => {
    try {
        await validateAdminAccess(req, res);
        logger.info('Getting membership application list.');
        const { year } = req.query;
        let applications : MembershipApplication[] = await getMembershipApplications(parseInt(year as string, 10));
        applications = applications.filter((app) => app.status !== 'Accepted');
        const workbookTitle = 'PRA applications';
        const workbook = startWorkbook(workbookTitle);
        const worksheet = workbook.getWorksheet(1);
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 6 },
            { header: 'Last Name', key: 'lastName', width: 10 },
            { header: 'First Name', key: 'firstName', width: 15 },
            { header: 'Age', key: 'age', width: 6 },
            { header: 'Location', key: 'location', width: 15 },
            { header: 'Referred By', key: 'referredBy', width: 15 },
            { header: 'Family Members', key: 'familyCount', width: 6 },
        ];
        applications.forEach((application: MembershipApplication) => {
            const row = {
                id: application.id,
                lastName: application.lastName,
                firstName: application.firstName,
                age: differenceInYears(new Date(), parseISO(application.birthDate)),
                location: application.city,
                referredBy: application.referredBy,
                familyCount: application.familyMembers.length,
            };
            worksheet.addRow(row);
        });
        formatWorkbook(worksheet);
        // write workbook to buffer.
        httpOutputWorkbook(workbook, res, `applications${new Date().getTime()}`);
    } catch (error) {
        logger.error(`Error at path ${req.path}`);
        logger.error(error);
        res.status(500);
        res.send(error);
    }
});

export default membershipApplication;
