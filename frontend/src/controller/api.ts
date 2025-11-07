import { generateHeaders } from './utils';
import { Member } from '../../../src/typedefs/member';

export default async function me(token: string): Promise<Member> {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/me`, {
        method: 'GET',
        mode: 'cors',
        headers: generateHeaders(token),
    });

    // Check if the response indicates an authentication error
    if (response.status === 401 || response.status === 403) {
        const error = new Error('Authentication failed');
        (error as any).status = response.status;
        throw error;
    }

    if (!response.ok) {
        const error = new Error(`API request failed with status ${response.status}`);
        (error as any).status = response.status;
        throw error;
    }

    return response.json();
}
