import { Request, Response, Router } from 'express';
import {
    getCognitoOAuthClientId,
    getCognitoClientSecret,
    getCognitoTokenEndpoint,
} from '../util/environmentWrapper';
import logger from '../logger';

// Node 18+ provides a global fetch, but the pinned @types/node (17.x) predates its
// typings. This module-scoped ambient declaration types only what we use and does
// not leak into the global scope.
declare function fetch(
    input: string,
    init?: { method?: string; headers?: Record<string, string>; body?: URLSearchParams },
): Promise<{ ok: boolean; status: number; json(): Promise<any> }>;

const auth = Router();

/**
 * Performs a request to the Cognito /oauth2/token endpoint. Adds the HTTP Basic
 * authorization header only when a client secret is configured (confidential app
 * client); public app clients send the client_id in the body instead.
 */
async function requestCognitoTokens(params: Record<string, string>) {
    // Use the single interactive OAuth client (not the verifier's comma-separated
    // allow-list) so client authentication at the token endpoint matches the client
    // that issued the authorization code.
    const [tokenEndpoint, clientId, clientSecret] = await Promise.all([
        getCognitoTokenEndpoint(),
        getCognitoOAuthClientId(),
        getCognitoClientSecret(),
    ]);

    const body = new URLSearchParams({ client_id: clientId, ...params });
    const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (clientSecret) {
        const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        headers.Authorization = `Basic ${basic}`;
    }

    const response = await fetch(tokenEndpoint, { method: 'POST', headers, body });
    const data = await response.json();
    if (!response.ok) {
        logger.error(`auth - Cognito token request failed (${response.status}): ${JSON.stringify(data)}`);
        const err: any = new Error(data.error || 'token_request_failed');
        err.status = response.status;
        // OAuth error code (e.g. invalid_client, invalid_grant) - safe, non-sensitive
        err.cognitoError = data.error;
        err.cognitoErrorDescription = data.error_description;
        throw err;
    }
    return data;
}

/**
 * Exchange an authorization code (from the hosted-UI redirect) for tokens.
 * Returns the id_token + refresh_token to the caller. The client secret never
 * leaves the backend.
 */
auth.post('/token', async (req: Request, res: Response) => {
    const { code, redirectUri } = req.body || {};
    if (!code || !redirectUri) {
        res.status(400).send({ reason: 'Missing code or redirectUri' });
        return;
    }
    try {
        const tokens = await requestCognitoTokens({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
        });
        res.status(200).send({
            idToken: tokens.id_token,
            refreshToken: tokens.refresh_token,
            expiresIn: tokens.expires_in,
        });
    } catch (e: any) {
        logger.error('auth - Failed to exchange authorization code', e);
        res.status(401).send({
            reason: 'Unable to exchange authorization code',
            error: e.cognitoError,
            errorDescription: e.cognitoErrorDescription,
        });
    }
});

/**
 * Use a refresh token to obtain a fresh id_token. Cognito only returns a new
 * refresh_token when rotation is enabled, so it is passed back when present.
 */
auth.post('/refresh', async (req: Request, res: Response) => {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
        res.status(400).send({ reason: 'Missing refreshToken' });
        return;
    }
    try {
        const tokens = await requestCognitoTokens({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        });
        res.status(200).send({
            idToken: tokens.id_token,
            // present only when refresh token rotation is enabled on the app client
            refreshToken: tokens.refresh_token,
            expiresIn: tokens.expires_in,
        });
    } catch (e: any) {
        logger.warn('auth - Refresh token rejected by Cognito');
        res.status(401).send({ reason: 'Invalid or expired refresh token' });
    }
});

export default auth;
