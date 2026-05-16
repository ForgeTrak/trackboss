import { apiRequest } from './utils';
import { Attendance, AttendanceCount } from '../../../src/typedefs/attendance';

export function checkIn(token: string, memberId: number, membershipId: number): Promise<Attendance> {
    return apiRequest(token, 'POST', '/api/attendance', { memberId, membershipId });
}

export function getAttendanceByMember(
    token: string,
    memberId: number,
    year?: number,
): Promise<Attendance[]> {
    const yearParam = year ? `?year=${year}` : '';
    return apiRequest(token, 'GET', `/api/attendance/member/${memberId}${yearParam}`);
}

export function getAttendanceLeaderboard(
    token: string,
    year?: number,
): Promise<AttendanceCount[]> {
    const yearParam = year ? `?year=${year}` : '';
    return apiRequest(token, 'GET', `/api/attendance/leaderboard${yearParam}`);
}
