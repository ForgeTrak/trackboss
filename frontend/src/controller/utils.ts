import moment from 'moment';

export const API_BASE = import.meta.env.VITE_API_URL;

const TOKEN_STORAGE_KEY = 'forgetrak_auth_token';
const REFRESH_TOKEN_STORAGE_KEY = 'forgetrak_refresh_token';

// Shared in-flight refresh so concurrent 401s trigger only one refresh request.
let refreshInFlight: Promise<string | null> | null = null;

/**
 * Attempt to obtain a fresh id_token using the stored refresh token. Updates
 * localStorage on success and returns the new token, or null if refresh fails.
 * Inlined here (rather than importing from ./auth) to avoid a circular import.
 */
async function refreshAccessToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    if (!refreshToken) {
        return null;
    }
    if (!refreshInFlight) {
        refreshInFlight = (async () => {
            try {
                const response = await fetch(`${API_BASE}/api/auth/refresh`, {
                    method: 'POST',
                    mode: 'cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });
                if (!response.ok) {
                    return null;
                }
                const data = await response.json();
                if (data.idToken) {
                    localStorage.setItem(TOKEN_STORAGE_KEY, data.idToken);
                    if (data.refreshToken) {
                        localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, data.refreshToken);
                    }
                    return data.idToken;
                }
                return null;
            } catch {
                return null;
            } finally {
                refreshInFlight = null;
            }
        })();
    }
    return refreshInFlight;
}

/* eslint-disable radix */
export function generateHeaders(token: string): Headers {
    return new Headers({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    });
}

export async function apiRequest<T>(
    token: string,
    method: string,
    path: string,
    body?: any,
    options?: { dateRange?: string; mode?: 'cors' | 'no-cors' },
): Promise<T> {
    let url = `${API_BASE}${path}`;
    if (options?.dateRange) {
        url += `?dateRange=${encodeURIComponent(options.dateRange)}`;
    }
    const doFetch = (authToken: string) => fetch(url, {
        method,
        mode: options?.mode || 'cors',
        headers: generateHeaders(authToken),
        ...(body !== undefined && { body: JSON.stringify(body) }),
    });

    let response = await doFetch(token);
    // On an auth failure, try a single silent refresh + retry before giving up.
    if (response.status === 401 || response.status === 403) {
        const refreshedToken = await refreshAccessToken();
        if (refreshedToken) {
            response = await doFetch(refreshedToken);
        }
    }
    return response.json();
}

export async function apiRequestBlob(
    token: string,
    path: string,
): Promise<Blob> {
    const response = await fetch(`${API_BASE}${path}`, {
        method: 'GET',
        mode: 'cors',
        headers: generateHeaders(token),
    });
    return response.blob();
}

export async function apiRequestNoAuth<T>(
    method: string,
    path: string,
    body?: any,
    options?: { mode?: 'cors' | 'no-cors'; headers?: Record<string, string> },
): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
        method,
        mode: options?.mode || 'cors',
        ...(options?.headers && { headers: options.headers }),
        ...(body !== undefined && { body: JSON.stringify(body) }),
    });
    return response.json();
}

// Creates a string with today's date in YYYYMMDD format
export function getTodaysDate() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
    const yyyy = today.getFullYear();

    const todayString = `${yyyy}${mm}${dd}`;
    return todayString;
}

export function getEventMonthDay(date: string) {
    const dateMoment = moment(date);
    return dateMoment.format('dddd MMMM DD');
}

function singleDayEvent(start: string, end: string) {
    const startString = new Date(start);
    const endString = new Date(end);

    return startString.getDate() === endString.getDate() &&
    startString.getMonth() === endString.getMonth();
}

export function getEventMonthDaySpan(start: string, end: string) {
    const startString = new Date(start).toString();
    const startStringArray = startString.split(' ');

    const endString = new Date(end).toString();
    const endStringArray = endString.split(' ');

    const formattedStartDate = `${startStringArray[2]} ${startStringArray[1]}`;
    const formattedEndDate = `${endStringArray[2]} ${endStringArray[1]}`;

    // if the event starts and ends on the same day, only return tgetEventMonthDayhat date
    if (singleDayEvent(start, end)) {
        return formattedStartDate;
    }
    // else: return a span
    return `${formattedStartDate} - ${formattedEndDate}`;
}

export function getEventStartAndEndTime(start: string, end: string) {
    if (!singleDayEvent(start, end)) {
        return ' ';
    }
    // only show start and end times for events that happen in one day
    const startString = new Date(start).toString();
    const startStringArray = startString.split(' ');
    let startHour = parseInt(startStringArray[4].substring(0, 2));
    const startMinute = startStringArray[4].substring(3, 5);

    // gets am or pm, and converts from military to standard hours
    const startAmOrPm = startHour >= 12 ? 'PM' : 'AM'; startHour = ((startHour + 11) % 12 + 1);

    const endString = new Date(end).toString();
    const endStringArray = endString.split(' ');
    let endHour = parseInt(endStringArray[4].substring(0, 2));
    const endMinute = endStringArray[4].substring(3, 5);
    // gets am or pm, and converts from military to standard hours
    const endAmOrPm = endHour >= 12 ? 'PM' : 'AM'; endHour = ((endHour + 11) % 12 + 1);

    const response = `${startHour}:${startMinute} ${startAmOrPm} - ${endHour}:${endMinute} ${endAmOrPm}`;
    if (response === '12:00 AM - 12:00 AM') {
        return 'All Day';
    }
    return response;
}

export function getTimeOfDay(time: string) {
    const dateMoment = moment(time);
    return dateMoment.format('h a');
}
