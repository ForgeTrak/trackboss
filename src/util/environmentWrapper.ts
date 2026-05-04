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
