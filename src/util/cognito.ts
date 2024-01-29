import AWS from 'aws-sdk';
import logger from '../logger';
import { Member } from '../typedefs/member';
import { sendPasswordReset } from './email';

/**
 * Create a new user in Cognito to allow them to login.
 *
 * @param email user email address.
 * @param isMembershipAdmin if the user should be a membership admin (used to create new members from applicants).
 * @returns the user UUID in cognito.
 */
export async function createCognitoUser(email: string, isMembershipAdmin: boolean) {
    const poolId = process.env.COGNITO_POOL_ID || '';
    const cognitoIdp = new AWS.CognitoIdentityServiceProvider();
    const createResponse = await cognitoIdp.adminCreateUser({
        UserPoolId: poolId,
        Username: email,
        UserAttributes: [
            {
                Name: 'email',
                Value: email,
            },
            {
                Name: 'email_verified',
                Value: 'True',
            },
        ],
    }).promise();
    logger.debug(JSON.stringify(createResponse));
    logger.info(`created Cognito user ${createResponse.User?.Username}`);
    const uuid = createResponse.User?.Username;
    if (uuid) {
        try {
            const groupResponse = await cognitoIdp.adminAddUserToGroup({
                UserPoolId: poolId,
                GroupName: 'member',
                Username: uuid,
            }).promise();
            logger.info(`User ${email} added to group member`);
            logger.debug(JSON.stringify(groupResponse));
            if (isMembershipAdmin) {
                const adminGroupResponse = await cognitoIdp.adminAddUserToGroup({
                    UserPoolId: poolId,
                    GroupName: 'membershipAdmin',
                    Username: uuid,
                }).promise();
                logger.info(`User ${email} added to group membershipAdmin`);
                logger.debug(JSON.stringify(adminGroupResponse));
            }
        } catch (error) {
            logger.error(`Unable to add ${email} to group member.  User still exists but login may not work correctly`);
            logger.error(error);
            throw error;
        }
    }
    return uuid;
}

export async function deleteCognitoUser(uuid: string) {
    logger.info(`Removing user ${uuid} from Cognito`);
    const poolId = process.env.COGNITO_POOL_ID || '';
    const cognitoIdp = new AWS.CognitoIdentityServiceProvider();
    const deleteResponse = await cognitoIdp.adminDeleteUser({
        UserPoolId: poolId,
        Username: uuid,
    }).promise();
    logger.info(`Removed user ${uuid} from Cognito`);
    logger.debug(deleteResponse);
}

export async function updateCognitoUserEmail(member: Member) {
    logger.info(`Updating an email address for ${member.uuid} in Cognito`);
    const poolId = process.env.COGNITO_POOL_ID || '';
    const cognitoIdp = new AWS.CognitoIdentityServiceProvider();
    const updateResponse = cognitoIdp.adminUpdateUserAttributes({
        UserPoolId: poolId,
        Username: member.uuid,
        UserAttributes: [
            {
                Name: 'email',
                Value: member.email,
            },
            {
                Name: 'email_verified',
                Value: 'true',
            },
        ],
    }).promise();
    logger.info(`Updated user ${member.uuid}'s email to ${member.email}`);
    logger.debug(updateResponse);
}

export async function resetCognitoPassword(member: Member, defaultValue: string) {
    logger.info(`Resetting password for user ${member.uuid} in Cognito`);
    const poolId = process.env.COGNITO_POOL_ID || '';
    const cognitoIdp = new AWS.CognitoIdentityServiceProvider();
    let resetResponse;
    if (!defaultValue) {
        resetResponse = await cognitoIdp.adminResetUserPassword({
            UserPoolId: poolId,
            Username: member.uuid,
        }).promise();
    } else {
        resetResponse = await cognitoIdp.adminSetUserPassword({
            UserPoolId: poolId,
            Username: member.uuid,
            Password: defaultValue,
            Permanent: false,
        }).promise();
    }
    await sendPasswordReset(member, defaultValue);
    logger.info(`reset password for user ${member.email} (${member.firstName} ${member.lastName})`);
    logger.debug(resetResponse);
}
