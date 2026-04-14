const { CognitoIdentityProviderClient, InitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');
const https = require('https');
const http = require('http');

const region = process.env.AWS_REGION || 'us-east-1';
const cognitoClient = new CognitoIdentityProviderClient({ region });

exports.handler = async function (event) {
    console.log('Billing runner lambda - starting');

    const { COGNITO_USERNAME, COGNITO_PASSWORD, COGNITO_CLIENT_ID, API_BASE_URL } = process.env;

    // Authenticate with Cognito to get an ID token
    const authResponse = await cognitoClient.send(new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: COGNITO_CLIENT_ID,
        AuthParameters: {
            USERNAME: COGNITO_USERNAME,
            PASSWORD: COGNITO_PASSWORD,
        },
    }));

    const token = authResponse.AuthenticationResult.IdToken;
    console.log('Billing runner lambda - obtained Cognito token');

    // Call POST /api/billing/
    const url = new URL('/api/billing/', API_BASE_URL);
    const response = await makeRequest(url, token);
    console.log(`Billing runner lambda - API response: ${response.statusCode}`);
    console.log(`Billing runner lambda - response body: ${response.body}`);

    return {
        statusCode: response.statusCode,
        body: response.body,
    };
};

function makeRequest(url, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        };

        const client = url.protocol === 'https:' ? https : http;
        const req = client.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, body });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}
