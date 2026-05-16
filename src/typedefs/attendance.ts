import { ErrorResponse } from './errorResponse';

export type Attendance = {
    attendanceId: number,
    tenantId?: string,
    memberId: number,
    membershipId: number,
    memberName?: string,
    checkInTime: string,
}

export type PostCheckInRequest = Record<string, never>;

export type PostCheckInResponse = Attendance | ErrorResponse;

export type GetAttendanceRequest = Record<string, never>;

export type GetAttendanceResponse = Attendance[] | ErrorResponse;

export type AttendanceCount = {
    memberId: number,
    membershipId: number,
    memberName: string,
    checkInCount: number,
}

export type GetAttendanceLeaderboardResponse = AttendanceCount[] | ErrorResponse;
