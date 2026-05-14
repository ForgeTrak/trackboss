const NONCE_KEY = 'oauth_state_nonce';

/**
 * Build the OAuth `state` parameter with a CSRF nonce.
 * The nonce is persisted in sessionStorage so the callback page can verify it.
 */
export function buildOAuthState(payload: Record<string, unknown>): string {
    const nonce = crypto.randomUUID();
    sessionStorage.setItem(NONCE_KEY, nonce);
    return btoa(JSON.stringify({ ...payload, nonce }));
}

/**
 * Decode and verify the OAuth `state` parameter returned by the IdP.
 * Throws if the nonce is missing or does not match what was stored in sessionStorage.
 */
export function verifyOAuthState(raw: string): Record<string, unknown> {
    const stateObj = JSON.parse(atob(raw));
    const expectedNonce = sessionStorage.getItem(NONCE_KEY);

    if (!expectedNonce) {
        throw new Error('No OAuth nonce found in session — possible CSRF or stale callback.');
    }
    if (stateObj.nonce !== expectedNonce) {
        throw new Error('OAuth state nonce mismatch — possible CSRF attack.');
    }

    // Nonce is single-use; clear it immediately after verification
    sessionStorage.removeItem(NONCE_KEY);
    return stateObj;
}
