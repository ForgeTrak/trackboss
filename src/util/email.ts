import AWS from 'aws-sdk';
import { RowDataPacket } from 'mysql2';
import logger from '../logger';
import { getPool } from '../database/pool';
import { getBoardMemberList } from '../database/boardMember';
import { Bill } from '../typedefs/bill';
import { Member } from '../typedefs/member';
import { getEnvironmentParameter } from './environmentWrapper';
import { calculateApplicationYear } from './dateHelper';

async function getEmailById(purpose: string) {
    const values = [purpose];
    let results;
    try {
        [results] = await getPool().query<RowDataPacket[]>('select * from emails where purpose = ?', values);
    } catch (e: any) {
        logger.error(`DB error gettting email with ID ${purpose}`, e);
    }
    const bccList : string[] = [];
    const emails = results?.map((result) => ({
        purpose: result.purpose,
        subject: result.subject,
        text: result.text,
        to: '',
        bcc: bccList,
        cc: '',
    })) || [];
    return emails[0];
}

export async function sendTextEmail(email: any) {
    AWS.config.update({ region: process.env.AWS_REGION });
    const clubEmail = await getEnvironmentParameter('clubEmail') || '';
    const ses = new AWS.SES();
    const emailParams = {
        Destination: {
            ToAddresses: [email.to],
            CcAddresses: [clubEmail],
            BccAddresses: email.bcc,
        },
        Message: {
            Subject: { Data: email.subject },
            Body: {
                Text: {
                    Charset: 'UTF-8',
                    Data: email.text,
                },
            },
        },
        ReplyToAddresses: [clubEmail],
        Source: 'admin@palmyramx.com',
    };
    try {
        // only send emails on real production trackboss. Anywhere else, just dump em to a log.  This is basically
        // intercepting the process at the last possible point but keeps us from messing up and sending emails to
        // members from dev which we never want to do.
        // if (process.env.ENVIRONMENT_NAME === 'trackboss') {
        await ses.sendEmail(emailParams).promise();
        // } else {
        logger.info(`This is environment ${process.env.ENVIRONMENT_NAME} so I'm logging this email`);
        logger.info(JSON.stringify(emailParams));
        // }
    } catch (error: any) {
        logger.error('Unable to send email via SES');
        logger.error(error);
    }
}

function addNameToEmail(firstName: string, lastName: string, emailText: string) {
    return emailText.replace(/firstName/, firstName).replace(/lastName/, lastName);
}

export async function sendAppConfirmationEmail(application: any) {
    const confirmEmail = await getEmailById('APP_CONFIRMATION');
    confirmEmail.text = confirmEmail.text.replace(/firstName/, application.firstName);
    confirmEmail.text = confirmEmail.text.replace(/lastName/, application.lastName);
    confirmEmail.text = confirmEmail.text.replace(/appId/, application.id);

    confirmEmail.to = application.email;
    const boardMembers = await getBoardMemberList(`${calculateApplicationYear()}`);
    boardMembers.forEach((member) => confirmEmail.bcc.push(member.email || ''));
    await sendTextEmail(confirmEmail);
    logger.info(`application emails sent for application ${application.id}`);
}

export async function sendNewMemberEmail(application: any) {
    const newMemberEmail = await getEmailById('NEW_MEMBERSHIP');
    newMemberEmail.text = addNameToEmail(application.firstName, application.lastName, newMemberEmail.text);
    if (application.applicationNotesShared) {
        newMemberEmail.text = newMemberEmail.text.replace(/applicationNotesShared/, application.applicationNotesShared);
    }
    newMemberEmail.to = application.email;
    await sendTextEmail(newMemberEmail);
    logger.info(`new applicant acceptance sent for application ${application.id} (${application.lastName})`);
}

export async function sendAppRejectedEmail(application: any) {
    const appRejectedEmail = await getEmailById('APPLICATION_REJECTED');
    appRejectedEmail.text = addNameToEmail(application.firstName, application.lastName, appRejectedEmail.text);
    if (application.applicationNotesShared) {
        appRejectedEmail.text =
            appRejectedEmail.text.replace(/applicationNotesShared/, application.applicationNotesShared);
    }
    appRejectedEmail.to = application.email;
    await sendTextEmail(appRejectedEmail);
    logger.info(`new applicant rejection sent for application ${application.id} (${application.lastName})`);
}

async function sendConfirmationEmail(bill: Bill, id: string) {
    const confirmationEmail = await getEmailById(id);
    confirmationEmail.text = addNameToEmail(bill.firstName, bill.lastName, confirmationEmail.text);
    confirmationEmail.to = bill.membershipAdminEmail;
    await sendTextEmail(confirmationEmail);
    logger.info(`${confirmationEmail.purpose} sent to ${bill.membershipAdminEmail}`);
}

export async function sendPaymentConfirmationEmail(bill: Bill) {
    await sendConfirmationEmail(bill, 'PAYMENT_CONFIRMED');
}

export async function sendInsuranceConfirmEmail(bill: Bill) {
    await sendConfirmationEmail(bill, 'INSURANCE_CONFIRMED');
}

export async function sendPasswordReset(member: Member, newValue: string) {
    const resetEmail = await getEmailById('PASSWORD_RESET');
    resetEmail.text = addNameToEmail(member.firstName, member.lastName, resetEmail.text);
    resetEmail.text = resetEmail.text.replace('PASSWORD', newValue);
    resetEmail.text = resetEmail.text.replace('EMAIL', member.email);
    resetEmail.to = member.email;
    await sendTextEmail(resetEmail);
    logger.info(`Reset email sent to ${member.firstName} ${member.lastName}`);
}
