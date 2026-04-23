/* eslint-disable import/prefer-default-export */
import AWS from 'aws-sdk';
import logger from '../logger';

let squareObject : any;

// Singleton clients - persist across warm Lambda invocations
const ssmClient = new AWS.SSM({
    apiVersion: '2014-11-06',
    region: 'us-east-1',
});
const secretsClient = new AWS.SecretsManager({ region: 'us-east-1' });

// Cache for SSM parameter values - survives across warm invocations
const paramCache = new Map<string, string>();

export async function getEnvironmentParameter(name: string) {
    const cached = paramCache.get(name);
    if (cached) {
        return cached;
    }
    const paramValue = '';
    try {
        const envData = await ssmClient.getParameter({
            Name: `/${name}`,
            WithDecryption: true,
        }).promise();
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
    return getEnvironmentParameter('cognitoPoolId');
}

export async function getCognitoClientId() {
    return getEnvironmentParameter('cognitoClientId');
}

export async function getConnectionObject() {
    const secretValue = await secretsClient.getSecretValue({
        SecretId: '/trackboss/app/rds',
    }).promise();
    logger.info(`environmentWrapper - Pulled database connection info from ${secretValue.Name}`);
    return JSON.parse(secretValue.SecretString || '');
}
