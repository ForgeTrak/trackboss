import { format } from 'date-fns';
import { Request, Response, Router } from 'express';

import {
    GetJobListResponse,
    PostNewJobResponse,
    GetJobListRequestFilters,
    Job,
    GetJobResponse,
    PatchJobResponse,
    DeleteJobResponse,
} from '../typedefs/job';
import { checkHeader, verify } from '../util/auth';

import {
    insertJob,
    getJob,
    getJobList,
    patchJob,
    deleteJob,
    setJobVerifiedState,
    removeSignup,
    getOpenEventJob,
} from '../database/job';

import { formatWorkbook, httpOutputWorkbook, startWorkbook } from '../excel/workbookHelper';

async function GetJobList(req: Request, res:Response) {
    const { authorization } = req.headers;
    let response: GetJobListResponse;
    const headerCheck = checkHeader(authorization);
    const verifyDate = (dateString: string) => {
        let valid = true;
        if (dateString === '') {
            valid = true;
        }
        const year = Number(dateString.slice(0, 4));
        const month = Number(dateString.slice(4, 6));
        const day = Number(dateString.slice(6, 8));
        if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
            valid = false;
        }
        return { valid, date: new Date(year, month - 1, day) };
    };
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);

            const { range } = req.headers;
            let startDate: string | undefined;
            let endDate: string | undefined;
            if (typeof range !== 'undefined') {
                const [start, end] = range.split('-');
                if (start === undefined || end === undefined) {
                    throw new Error('user input error');
                }
                const startData = verifyDate(start);
                const endData = verifyDate(end);
                if (!startData.valid || !endData.valid) {
                    throw new Error('user input error');
                } else if (start === '' && end !== '') {
                    endDate = `${format(endData.date, 'yyyy-MM-dd')}`;
                } else if (end === '' && start !== '') {
                    startDate = `${format(startData.date, 'yyyy-MM-dd')}`;
                } else {
                    startDate = `${format(startData.date, 'yyyy-MM-dd')}`;
                    endDate = `${format(endData.date, 'yyyy-MM-dd')}`;
                }
            }
            const assignmentStatus: string | undefined = req.query.assignmentStatus as string;
            const verificationStatus: string | undefined = req.query.verificationStatus as string;
            const memberId: string | undefined = req.query.memberID as string;
            const membershipId: string | undefined = req.query.membershipID as string;
            const eventId: string | undefined = req.query.eventID as string;
            const filters: GetJobListRequestFilters = {};
            if (typeof assignmentStatus !== 'undefined' &&
            (assignmentStatus !== 'open' && assignmentStatus !== 'assigned')) {
                res.status(400);
                response = { reason: 'bad request' };
            } else if (typeof verificationStatus !== 'undefined' &&
            (verificationStatus !== 'pending' && verificationStatus !== 'verified')) {
                res.status(400);
                response = { reason: 'bad request' };
            } else if (Number.isNaN(Number(memberId)) && typeof memberId !== 'undefined') {
                res.status(400);
                response = { reason: 'bad request' };
            } else if (Number.isNaN(Number(membershipId)) && typeof membershipId !== 'undefined') {
                res.status(400);
                response = { reason: 'bad request' };
            } else if (Number.isNaN(Number(eventId)) && typeof eventId !== 'undefined') {
                res.status(400);
                response = { reason: 'bad request' };
            } else {
                if (typeof assignmentStatus !== 'undefined') {
                    filters.assignmentStatus = (assignmentStatus === 'assigned');
                }
                if (typeof verificationStatus !== 'undefined') {
                    filters.verificationStatus = (verificationStatus === 'verified');
                }
                if (typeof memberId !== 'undefined') {
                    filters.memberId = Number(memberId);
                }
                if (typeof membershipId !== 'undefined') {
                    filters.membershipId = Number(membershipId);
                }
                if (typeof eventId !== 'undefined') {
                    filters.eventId = Number(eventId);
                }
                if (typeof startDate !== 'undefined') {
                    filters.startDate = startDate;
                }
                if (typeof endDate !== 'undefined') {
                    filters.endDate = endDate;
                }
                const jobList: Job[] = await getJobList(filters);
                if (typeof filters.startDate !== 'undefined' || typeof filters.endDate !== 'undefined') {
                    res.status(206);
                } else {
                    res.status(200);
                }
                response = jobList;
            }
        } catch (e: any) {
            if (e.message === 'user input error') {
                res.status(400);
                response = { reason: 'bad request' };
            } else if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    return response;
}

const job = Router();

job.post('/new', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PostNewJobResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token, 'Admin');
            const insertId = await insertJob(req.body);
            response = await getJob(insertId);
            res.status(201);
        } catch (e: any) {
            if (e.message === 'user input error') {
                res.status(400);
                response = { reason: 'bad request' };
            } else if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else if (e.message === 'Forbidden') {
                res.status(403);
                response = { reason: 'forbidden' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

job.patch('/event/:eventId/:memberId', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PatchJobResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        const { eventId, memberId } = req.params;
        // get an open event job.  This would normally be a meeting or a work day so there should be plenty.
        const eventJob = await getOpenEventJob(parseInt(eventId, 10));
        eventJob.memberId = parseInt(memberId, 10);
        await patchJob(eventJob.jobId, eventJob);
        response = eventJob;
    }
    res.send(response);
});

job.get('/list', async (req: Request, res: Response) => {
    const response = await GetJobList(req, res);
    res.send(response);
});

job.get('/list/excel', async (req: Request, res: Response) => {
    // get the jobs list with the given parameters.
    const jobsList = await GetJobList(req, res) as Job[];
    // Create workbook and some meta datars about it.
    const workbook = startWorkbook(`Signups for ${jobsList[0].event}`);
    const worksheet = workbook.getWorksheet(1);
    worksheet.columns = [
        { header: 'Name', key: 'name', width: 13 },
        { header: 'Job', key: 'job', width: 23 },
        { header: 'Day', key: 'day', width: 10 },
        { header: 'Points', key: 'pointValue', width: 6 },
        { header: 'Cash', key: 'cashValue', width: 5 },
        { header: 'Meal Ticket', key: 'mealTicket', width: 6 },
        { header: 'Signature', key: 'signature', width: 32 },
    ];
    // add data
    jobsList.forEach((jobRow) => {
        worksheet.addRow({
            name: jobRow.member,
            job: jobRow.title,
            day: jobRow.jobDay,
            pointValue: jobRow.pointsAwarded,
            cashValue: jobRow.cashPayout,
            mealTicket: jobRow.mealTicket,
            signature: '',
        });
    });
    formatWorkbook(worksheet);
    // write workbook to buffer.
    httpOutputWorkbook(workbook, res, `signups${new Date().getTime()}.xlsx`);
});

job.get('/:jobId', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetJobResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const { jobId } = req.params;
            const id = Number(jobId);
            if (Number.isNaN(id)) {
                throw new Error('not found');
            }
            response = await getJob(id);
            res.status(200);
        } catch (e: any) {
            if (e.message === 'not found') {
                res.status(404);
                response = { reason: 'not found' };
            } else if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

job.patch('/:jobId', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: PatchJobResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            const { jobId } = req.params;
            await verify(headerCheck.token, 'Member');
            const id = Number(jobId);
            if (Number.isNaN(id)) {
                throw new Error('not found');
            }
            await patchJob(Number(jobId), req.body);
            response = await getJob(id);
            res.status(200);
        } catch (e: any) {
            if (e.message === 'user input error') {
                res.status(400);
                response = { reason: 'bad request' };
            } else if (e.message === 'not found') {
                res.status(404);
                response = { reason: 'not found' };
            } else if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else if (e.message === 'Forbidden') {
                res.status(403);
                response = { reason: 'forbidden' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

job.patch('/verify/:jobId/:state', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetJobResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const { jobId, state } = req.params;
            const id = Number(jobId);
            const verifiedState = (state === 'true');
            if (Number.isNaN(id)) {
                throw new Error('not found');
            }
            await setJobVerifiedState(id, verifiedState);
            response = await getJob(id);
            res.status(200);
        } catch (e: any) {
            if (e.message === 'not found') {
                res.status(404);
                response = { reason: 'not found' };
            } else if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

job.patch('/remove/signup/:jobId', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: GetJobResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            await verify(headerCheck.token);
            const { jobId } = req.params;
            const id = Number(jobId);
            if (Number.isNaN(id)) {
                throw new Error('not found');
            }
            await removeSignup(id);
            response = await getJob(id);
            res.status(200);
        } catch (e: any) {
            if (e.message === 'not found') {
                res.status(404);
                response = { reason: 'not found' };
            } else if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

//  Cloning Jobs is a feature that got lost in the shuffle along the way
//  The front end does not currently support cloning jobs so we decided
//  It would not be worth the risk of introducing new bugs at this point
//
// job.post('/:jobId', (req: Request, res: Response) => {
//     res.status(501).send();
// });

job.delete('/:jobId', async (req: Request, res: Response) => {
    const { authorization } = req.headers;
    let response: DeleteJobResponse;
    const headerCheck = checkHeader(authorization);
    if (!headerCheck.valid) {
        res.status(401);
        response = { reason: headerCheck.reason };
    } else {
        try {
            const { jobId } = req.params;
            const id = Number(jobId);
            if (Number.isNaN(id)) {
                throw new Error('not found');
            }
            await verify(headerCheck.token, 'Admin');
            await deleteJob(id);
            response = { jobId: id };
            res.status(200);
        } catch (e: any) {
            if (e.message === 'not found') {
                res.status(404);
                response = { reason: 'not found' };
            } else if (e.message === 'Authorization Failed') {
                res.status(401);
                response = { reason: 'not authorized' };
            } else if (e.message === 'Forbidden') {
                res.status(403);
                response = { reason: 'forbidden' };
            } else {
                res.status(500);
                response = { reason: 'internal server error' };
            }
        }
    }
    res.send(response);
});

export default job;
