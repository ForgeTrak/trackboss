/* eslint-disable import/prefer-default-export */
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import logger from '../logger';

let squareObject : any;

// Singleton clients - persist across warm Lambda invocations
const ssmClient = new SSMClient({ region: 'us-east-1' });
const secretsClient = new SecretsManagerClient({ region: 'us-east-1' });

// Cache for SSM parameter values - survives across warm invocations
const paramCache = new Map<string, string>();

export async function getEnvironmentParameter(name: string) {
    const cached = paramCache.get(name);
    if (cached) {
        return cached;
    }
    const paramValue = '';
    try {
        const envData = await ssmClient.send(new GetParameterCommand({
            Name: `/${name}`,
            WithDecryption: true,
        }));
        logger.info(`environmentWrapper - Retrieved environment parameter ${name}`);
        const value = envData.Parameter?.Value || '';
        paramCache.set(name, value);
        return value;
    } catch (error) {
        logger.error(error);
    }
    return paramValue;
}

export async function getCognitoPoolId() {
    return process.env.COGNITO_POOL_ID || getEnvironmentParameter('cognitoPoolId');
}

export async function getCognitoClientId() {
    return process.env.COGNITO_CLIENT_ID || getEnvironmentParameter('cognitoClientId');
}

// The single app client used for the hosted-UI authorization code flow. The
// verifier's cognitoClientId may be a comma-separated whitelist (web + API clients),
// but the token endpoint must authenticate as exactly one client. Prefer an explicit
// value, otherwise fall back to the first entry of the client id list.
export async function getCognitoOAuthClientId() {
    const explicit = process.env.COGNITO_OAUTH_CLIENT_ID;
    if (explicit) {
        return explicit;
    }
    const clientIds = await getCognitoClientId();
    return clientIds.split(',')[0].trim();
}

// Optional: only set for confidential (secret-bearing) app clients. Returns '' when the
// app client is public so the token exchange can skip the Basic auth header.
export async function getCognitoClientSecret() {
    return process.env.COGNITO_CLIENT_SECRET || getEnvironmentParameter('cognitoClientSecret');
}

// Base URL of the Cognito hosted UI / OAuth domain, e.g. https://auth.forgetrak.com
// (matches the frontend VITE_AUTH_URL). Used to build the /oauth2/token endpoint.
export async function getCognitoAuthUrl() {
    return process.env.COGNITO_AUTH_URL || getEnvironmentParameter('cognitoAuthUrl');
}

export async function getCognitoTokenEndpoint() {
    const baseUrl = await getCognitoAuthUrl();
    if (!baseUrl) {
        logger.error('No Cognito auth URL configured (COGNITO_AUTH_URL env or cognitoAuthUrl SSM parameter)');
        throw new Error('Cognito auth URL is not configured');
    }
    return `${baseUrl.replace(/\/$/, '')}/oauth2/token`;
}

export async function getConnectionObject() {
    const secretId = process.env.RDS_CONNECTION_ID || '';
    if (secretId) {
        const secretValue = await secretsClient.send(new GetSecretValueCommand({
            SecretId: secretId,
        }));
        logger.info(`environmentWrapper - Pulled database connection info from ${secretValue.Name}`);
        return JSON.parse(secretValue.SecretString || '');
    }
    return '';
}
