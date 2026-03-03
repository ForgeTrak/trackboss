import { OkPacket, RowDataPacket } from 'mysql2';
import { getPool } from './pool';
import logger from '../logger';
import { MembershipApplication } from '../typedefs/membershipApplication';
import { calculateApplicationYear } from '../util/dateHelper';

export async function insertMembershipApplication(membershipApplication: any): Promise<number> {
    const applicationYear = calculateApplicationYear();
    const values = ['Review', membershipApplication.email, JSON.stringify(membershipApplication), applicationYear];
    let result;
    // eslint-disable-next-line max-len
    const insertSql = 'insert into membership_application (application_status, application_email, application_json, application_season) values (?, ?, ?, ?)';
    try {
        [result] = await getPool().query<OkPacket>(insertSql, values);
        logger.info(`Inserted application with id ${result.insertId}`);
    } catch (e: any) {
        logger.error(e);
        throw e;
    }
    return result.insertId;
}

export async function getMembershipApplications(year: number) : Promise<MembershipApplication[]> {
    let results;
    try {
        const applicationsQuery =
            // eslint-disable-next-line max-len
            'select * from membership_application where application_season = ? order by application_status desc, application_date';
        [results] = await getPool()
            .query<RowDataPacket[]>(applicationsQuery, [year]);
    } catch (e) {
        logger.error(`DB error getting bike list: ${e}`);
        throw new Error('internal server error');
    }
    const applications : MembershipApplication[] = [];
    results.forEach((result) => {
        const app : MembershipApplication = result.application_json;
        app.id = result.membership_application_id;
        app.status = result.application_status;
        app.internalNotes = result.application_notes_internal;
        app.sharedNotes = result.application_notes_shared;
        app.applicationPriority = result.application_priority;
        applications.push(app);
    });
    return applications;
}

export async function getMembershipApplication(id: number) : Promise<MembershipApplication> {
    let results;
    try {
        const applicationsQuery =
            // eslint-disable-next-line max-len
            'select * from membership_application where membership_application_id = ?';
        // eslint-disable-next-line max-len
        [results] = await getPool().query<RowDataPacket[]>(applicationsQuery, [id]);
    } catch (e) {
        logger.error(`DB error getting bike list: ${e}`);
        throw new Error('internal server error');
    }
    const applications = results[0].application_json;
    applications.id = results[0].membership_application_id;
    // clean up any spaces in the email - no good, can't use em.
    applications.email = results[0].application_email.replace(/\s/g, '');
    applications.status = results[0].application_status;
    applications.internalNotes = results[0].application_notes_internal;
    applications.sharedNotes = results[0].application_notes_shared;
    return applications;
}

export async function applicationExistsForEmail(email: string) : Promise<boolean> {
    let results;
    try {
        const applicationsQuery =
            'select * from membership_application where application_email = ? and application_status = \'Review\'';
        // eslint-disable-next-line max-len
        [results] = await getPool().query<RowDataPacket[]>(applicationsQuery, [email]);
    } catch (e) {
        logger.error(`DB error getting application by email: ${e}`);
        throw new Error('internal server error');
    }
    return (results.length > 0);
}

export async function updateApplicationStatus(
    id: number,
    newStatus: string,
    internalNotes: string,
    applicantNotes: string,
) : Promise<MembershipApplication> {
    let results;
    try {
        const updateQuery =
            `update membership_application set application_status = ?, application_notes_internal = ?,
              application_notes_shared = ? where membership_application_id = ?`;
        [results] = await getPool().query<OkPacket>(updateQuery, [newStatus, internalNotes, applicantNotes, id]);
        return getMembershipApplication(id);
    } catch (e) {
        logger.error(`DB error updating application status: ${e}`);
        throw new Error('Internal server error');
    }
}
