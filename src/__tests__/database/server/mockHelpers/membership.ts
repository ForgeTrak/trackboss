/* eslint-disable no-await-in-loop */
// This rule assumes I'm trying to do multiple async tasks at once, meaning
// awaits in a loop would be inefficient. I do not want to do that here - I just
// want to poll registeredMemberIdRead, and I want to wait a bit between each
// poll.

/* eslint-disable no-throw-literal */
// ESLint doesn't like `throw { errno: # }` since it's not throwing an error, but for a
// mock, that is sufficient because we only care about 'errno' and it's easier than
// instantiating an implementor of NodeJS.ErrnoException to get that field

import { Mutex } from 'async-mutex';
// eslint-disable-next-line import/no-unresolved
import { setTimeout } from 'timers/promises';

const registeredMemberIdReadMutex = new Mutex();
let registeredMemberId: number;
let registeredMemberIdRead = true;

export function getMembershipListResponse(values: string[]) {
    const membershipList = [
        {
            membership_id: 1,
            status: 'Active',
            cur_year_renewed: [0],
            renewal_sent: [0],
        }, {
            membership_id: 2,
            status: 'Disabled',
            cur_year_renewed: [0],
            renewal_sent: [0],
        }, {
            membership_id: 3,
            status: 'Pending',
            cur_year_renewed: [0],
            renewal_sent: [0],
        },
    ];

    if (values.length === 0) {
        return Promise.resolve([membershipList]);
    }
    if (values[0] === 'ise') {
        throw new Error('error message');
    }

    return Promise.resolve([membershipList.filter((membership) => membership.status === values[0])]);
}

export function getMembershipResponse(id: number) {
    switch (id) {
        case 18:
            return Promise.resolve([[{
                membership_id: 18,
                membership_admin: 'membershipAdmin',
                status: 'Active',
                cur_year_renewed: [0],
                renewal_sent: [0],
                year_joined: 2022,
                address: '1 Test St',
                city: 'Rotester',
                state: 'NT',
                zip: '11111',
                last_modified_date: '2022-02-08',
                last_modified_by: 'modifier',
            }]]);
        case 765:
            return Promise.resolve([[]]);
        case -100:
            throw new Error('error message');
        default:
            return Promise.resolve();
    }
}

export function insertMembershipResponse(membershipAdminId: number) {
    switch (membershipAdminId) {
        case 42:
            return Promise.resolve([{ insertId: 321 }]);
        case 1452:
            throw { errno: 1452 };
        case -100:
            throw { errno: 0 };
        case -200:
            throw new Error('this error should not happen');
        default:
            return Promise.resolve();
    }
}

export function patchMembershipResponse(id: number) {
    switch (id) {
        case 42:
            return Promise.resolve([{ affectedRows: 1 }]);
        case 3000:
            return Promise.resolve([{ affectedRows: 0 }]);
        case 1451:
            throw { errno: 1451 };
        case -100:
            throw { errno: 0 };
        case -200:
            throw new Error('this error should not happen');
        default:
            return Promise.resolve();
    }
}

export async function registerMembershipResponse(memberTypeId: number) {
    switch (memberTypeId) {
        case 42: {
            let release = await registeredMemberIdReadMutex.acquire();
            try {
                while (!registeredMemberIdRead) {
                    release();
                    await setTimeout(500);
                    release = await registeredMemberIdReadMutex.acquire();
                }
                registeredMemberId = 321;
                registeredMemberIdRead = false;
            } finally {
                release();
            }
            return Promise.resolve();
        }
        case 1452:
            throw { errno: 1452 };
        case -100:
            throw { errno: 0 };
        case -101: {
            let release = await registeredMemberIdReadMutex.acquire();
            try {
                while (!registeredMemberIdRead) {
                    release();
                    await setTimeout(500);
                    release = await registeredMemberIdReadMutex.acquire();
                }
                registeredMemberId = -101;
                registeredMemberIdRead = false;
            } finally {
                release();
            }
            return Promise.resolve();
        }
        case -200:
            throw new Error('this error should not happen');
        default:
            return Promise.resolve();
    }
}

export async function getRegisteredMemberIdResponse() {
    let release = await registeredMemberIdReadMutex.acquire();
    try {
        while (registeredMemberIdRead) {
            release();
            await setTimeout(500);
            release = await registeredMemberIdReadMutex.acquire();
        }
        if (registeredMemberId === -101) {
            throw new Error('internal server error');
        }
        return Promise.resolve([[{ '@member_id': registeredMemberId }]]);
    } finally {
        registeredMemberIdRead = true;
        release();
    }
}

export function getBaseDuesResponse(id: number) {
    switch (id) {
        case 18:
            return Promise.resolve([[{ base_dues_amt: 500 }]]);
        case 765:
            return Promise.resolve([[]]);
        case -100:
            throw new Error('error message');
        default:
            return Promise.resolve();
    }
}
