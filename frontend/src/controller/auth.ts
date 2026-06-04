import { API_BASE } from './utils';

export interface TokenResponse {
    idToken: string;
    refreshToken?: string;
    expiresIn?: number;
}

/**
 * Exchange a Cognito authorization code for tokens via the backend.
 * The backend keeps the client secret and returns the id + refresh tokens.
 */
export async function exchangeCode(code: string, redirectUri: string): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE}/api/auth/token`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri }),
    });
    if (!response.ok) {
        const error = new Error('Failed to exchange authorization code');
        (error as any).status = response.status;
        throw error;
    }
    return response.json();
}

/**
 * Use a stored refresh token to obtain a fresh id_token. Throws (with status) on
 * failure so callers can fall back to a full re-login.
 */
export async function refreshIdToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) {
        const error = new Error('Failed to refresh token');
        (error as any).status = response.status;
        throw error;
    }
    return response.json();
}
