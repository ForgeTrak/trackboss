import React, { useEffect, useState } from 'react';
import { Center, Spinner, Text, VStack } from '@chakra-ui/react';
import getTenantBySlug from '../controller/tenant';
import { fromBase64Url } from '../util/oauthState';

/**
 * Centralized OAuth callback page. Cognito always redirects here after login.
 *
 * The fragment contains the id_token and the state parameter, which encodes
 * the tenant info AND the origin the user came from.  If the current origin
 * matches the caller origin we hand off to the normal App auth flow;
 * otherwise we redirect the user back to their tenant domain with the token
 * in the hash so App.tsx can pick it up as usual.
 */
export default function CallbackPage() {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function handleCallback() {
            try {
                const hash = window.location.hash.substring(1); // strip leading #
                if (!hash) {
                    setError('No authentication data received from login provider.');
                    return;
                }

                const params = new URLSearchParams(hash);
                const idToken = params.get('id_token');
                const stateRaw = params.get('state');

                if (!idToken) {
                    setError('No token received from login provider.');
                    return;
                }

                if (!stateRaw) {
                    setError('Missing state parameter — unable to determine tenant.');
                    return;
                }

                // Decode state to get the caller origin
                const stateObj = JSON.parse(fromBase64Url(stateRaw));
                const callerOrigin: string = stateObj.origin;

                // Validate that the origin belongs to a real tenant
                const slug = new URL(callerOrigin).hostname.split('.')[0];
                await getTenantBySlug(slug);

                // Redirect to the tenant's domain with the token in the hash.
                // encodeURIComponent ensures base64url chars survive the redirect.
                const target = `${callerOrigin}/#id_token=${encodeURIComponent(idToken)}&state=${encodeURIComponent(stateRaw)}`;
                window.location.replace(target);
            } catch (e: any) {
                // eslint-disable-next-line no-console
                console.error('Callback error', e);
                setError('Unable to complete login. The tenant could not be verified.');
            }
        }

        handleCallback();
    }, []);

    if (error) {
        return (
            <Center h="100vh">
                <VStack>
                    <Text fontSize="xl" color="red.500">{error}</Text>
                </VStack>
            </Center>
        );
    }

    return (
        <Center h="100vh">
            <VStack>
                <Spinner size="xl" />
                <Text>Completing login…</Text>
            </VStack>
        </Center>
    );
}
