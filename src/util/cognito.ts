import {
    CognitoIdentityProviderClient,
    AdminCreateUserCommand,
    AdminAddUserToGroupCommand,
    AdminDeleteUserCommand,
    AdminUpdateUserAttributesCommand,
    AdminResetUserPasswordCommand,
    AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import logger from '../logger';
import { Member } from '../typedefs/member';
import { sendPasswordReset } from './email';
import { getCognitoPoolId } from './environmentWrapper';

/**
 * Create a new user in Cognito to allow them to login.
 *
 * @param email user email address.
 * @param isMembershipAdmin if the user should be a membership admin (used to create new members from applicants).
 * @param tenantId the tenant ID to associate with the user.
 * @returns the user UUID in cognito.
 */
export async function createCognitoUser(email: string, isMembershipAdmin: boolean, tenantId: string) {
    const poolId = await getCognitoPoolId() || '';
    const cognitoIdp = new CognitoIdentityProviderClient({ region: 'us-east-1' });
    const tenantIds = [tenantId];
    const createResponse = await cognitoIdp.send(new AdminCreateUserCommand({
        UserPoolId: poolId,
        Username: email,
        UserAttributes: [
            {
                Name: 'email',
                Value: email.replace(/\s/g, ''),
            },
            {
                Name: 'email_verified',
                Value: 'True',
            },
            {
                Name: 'custom:tenant_ids',
                Value: JSON.stringify(tenantIds),
            },
        ],
    }));
    logger.debug(JSON.stringify(createResponse));
    logger.info(`cognito - created Cognito user ${createResponse.User?.Username}`);
    const uuid = createResponse.User?.Username;
    if (uuid) {
        try {
            const groupResponse = await cognitoIdp.send(new AdminAddUserToGroupCommand({
                UserPoolId: poolId,
                GroupName: 'member',
                Username: uuid,
            }));
            logger.info(`cognito - User ${email} added to group member`);
            logger.debug(JSON.stringify(groupResponse));
            if (isMembershipAdmin) {
                const adminGroupResponse = await cognitoIdp.send(new AdminAddUserToGroupCommand({
                    UserPoolId: poolId,
                    GroupName: 'membershipAdmin',
                    Username: uuid,
                }));
                logger.info(`cognito - User ${email} added to group membershipAdmin`);
                logger.debug(JSON.stringify(adminGroupResponse));
            }
        } catch (error) {
            // eslint-disable-next-line max-len
            logger.error(`cognito - Unable to add ${email} to group member.  User still exists but login may not work correctly`);
            logger.error(error);
            throw error;
        }
    }
    return uuid;
}

export async function deleteCognitoUser(uuid: string) {
    logger.info(`cognito - Removing user ${uuid} from Cognito`);
    const poolId = await getCognitoPoolId() || '';
    const cognitoIdp = new CognitoIdentityProviderClient({ region: 'us-east-1' });
    const deleteResponse = await cognitoIdp.send(new AdminDeleteUserCommand({
        UserPoolId: poolId,
        Username: uuid,
    }));
    logger.info(`cognito - Removed user ${uuid} from Cognito`);
    logger.debug(deleteResponse);
}

export async function updateCognitoUserEmail(member: Member) {
    logger.info(`cognito - Updating an email address for ${member.uuid} in Cognito`);
    const poolId = await getCognitoPoolId() || '';
    const cognitoIdp = new CognitoIdentityProviderClient({ region: 'us-east-1' });
    const updateResponse = cognitoIdp.send(new AdminUpdateUserAttributesCommand({
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
    }));
    logger.info(`cognito - Updated user ${member.uuid}'s email to ${member.email}`);
    logger.debug(updateResponse);
}

export async function resetCognitoPassword(member: Member, defaultValue: string) {
    logger.info(`cognito - Resetting password for user ${member.uuid} in Cognito`);
    const poolId = await getCognitoPoolId() || '';
    const cognitoIdp = new CognitoIdentityProviderClient({ region: 'us-east-1' });
    let resetResponse;
    if (!defaultValue) {
        resetResponse = await cognitoIdp.send(new AdminResetUserPasswordCommand({
            UserPoolId: poolId,
            Username: member.uuid,
        }));
    } else {
        resetResponse = await cognitoIdp.send(new AdminSetUserPasswordCommand({
            UserPoolId: poolId,
            Username: member.uuid,
            Password: defaultValue,
            Permanent: false,
        }));
    }
    await sendPasswordReset(member, defaultValue, member.tenantId);
    logger.info(`cognito - reset password for user ${member.email} (${member.firstName} ${member.lastName})`);
    logger.debug(resetResponse);
}
