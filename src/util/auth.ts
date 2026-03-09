import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { CognitoJwtVerifierSingleUserPool } from 'aws-jwt-verify/cognito-verifier';
import { Request, Response } from 'express';
import { getCognitoClientId, getCognitoPoolId } from './environmentWrapper';
import { getMember, getValidActors } from '../database/member';
import logger from '../logger';

let verifier: CognitoJwtVerifierSingleUserPool<{ userPoolId: string; tokenUse: 'id'; clientId: string[]; }>;

const createVerifier = async () => {
    const poolId = await getCognitoPoolId();
    const clientId = await getCognitoClientId();
    if (!poolId) {
        logger.error('No Cognito User Pool ID specified in environment');
        throw new Error('Auth setup failed due to missing pool ID');
    }
    if (!clientId) {
        logger.error('No Cognito Client ID in environment');
        throw new Error('Auth setup failed due to missing client ID');
    }
    const clientIds = clientId.split(',');
    verifier = CognitoJwtVerifier.create({
        userPoolId: poolId,
        tokenUse: 'id',
        clientId: clientIds,
    });
};

const verify = async (token: string, permissionLevel?: string, targetActingAs?: number) => {
    if (!verifier) {
        // throw new Error('Attempted to use verifier before it was created');
        await createVerifier();
    }
    try {
        const payload = await verifier.verify(token);
        const tenantId = payload.active_tenant_id as string;
        if (permissionLevel) {
            const member = await getMember(payload['cognito:username'], tenantId);
            payload.memberId = member.memberId;
            let actingAs = targetActingAs;
            if (typeof actingAs === 'undefined') {
                actingAs = member.memberId;
            }
            if (permissionLevel === 'Admin') {
                if ((member.memberType !== 'Admin') && (!member.isBoardMember)) {
                    throw new Error(`Tried to perform an admin action as ${member.memberType}.  This isn't allowed!`);
                }
            } else if (permissionLevel === 'Membership Admin') {
                if (member.memberType !== 'Admin') {
                    if (member.memberType === 'Membership Admin') {
                        // make sure they have permission to act on this
                        const memberActingAs = await getMember(`${actingAs}`, tenantId);
                        if (memberActingAs.membershipAdminId !== member.memberId) {
                            throw new Error(`${member.firstName} ${member.lastName} perform an action 
                                on ${memberActingAs.firstName} ${memberActingAs.lastName}.  This is probably a bug.`);
                        }
                    } else {
                        throw new Error('Forbidden');
                    }
                }
            } else if (permissionLevel === 'Member') {
                if (member.memberType === 'Paid Laborer') {
                    throw new Error('Forbidden');
                }
                if (member.memberType !== 'Admin') {
                    // check that they have permission to act on this
                    const validActors = await getValidActors(actingAs, tenantId);
                    if (!validActors.includes(member.memberId)) {
                        throw new Error('Forbidden');
                    }
                }
            }
        }
        logger.debug(JSON.stringify(payload));
        return payload;
    } catch (e: any) {
        logger.error('invalid token');
        logger.error(e);
        if (e.message === 'Forbidden') {
            throw new Error('Forbidden');
        }
        throw new Error('Authorization Failed');
    }
};

export type HeaderCheck = {
    valid: boolean,
    reason: string,
    token: string
};

const checkHeader = (header?: string): HeaderCheck => {
    let valid;
    let reason = '';
    let token = '';
    if (typeof header === 'undefined') {
        return {
            valid: false,
            reason: 'Missing authorization grant in header',
            token: '',
        };
    }
    const parts = header.split(' ');
    const [type, headerToken] = parts;
    if (parts.length !== 2) {
        valid = false;
        reason = 'Authorization grant in header has invalid structure';
    } else if (type !== 'Bearer') {
        valid = false;
        reason = 'Incorrect token type in authorization grant';
    } else {
        valid = true;
        reason = '';
        token = headerToken;
    }
    return { valid, reason, token };
};

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

export { checkHeader, createVerifier, verify, validateAdminAccess };
