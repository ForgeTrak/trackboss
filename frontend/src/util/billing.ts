import { isAfter, isBefore } from 'date-fns';

/**
 * Set years for billing display based on a set of pre-defined rules.  If the month is after August, then it will show
 * the current year.  Otherwise it will show the prior year.  This handles rollovers from year to year when we want
 * to see the prior year's data.
 *
 * This uses the React style of calling a function with a function to call as a parameter, rather than returning values.
 *
 * @param setInitialYear function to set the initial year on front end.
 * @param setYearsList function to set the years list on the front end.
 */
export function getYearsForBillingDisplay(setInitialYear: Function, setYearsList: Function) {
    const displayYears = [];
    const now = new Date();
    const nowYear = now.getFullYear();
    // if it's after August, show next year
    if (now.getMonth() > 7) {
        setInitialYear(nowYear + 1);
    } else {
        // otherwise, show this year
        setInitialYear(nowYear);
    }
    for (let pushYear = 2022; pushYear <= nowYear + 1; pushYear++) {
        displayYears.push(pushYear);
    }
    setYearsList(displayYears.sort().reverse());
}

/**
 * Calculate the billing year based on the current date.  The rules are as follows:
 * Before May 31st, it's the prior billing year because we are still working on renewals,
 * new memberships.
 * After May 31st, it's the current billing year because all that paperwork is done so it is business as usual.
 *
 * @return number The billing year based on the logic.
 */
export function calculateBillingYear() : number {
    const rightNow = new Date();
    const rightNowYear = rightNow.getFullYear();
    let billingYear = rightNowYear;
    if (isBefore(rightNow, (new Date(rightNowYear, 10)))) {
        billingYear -= 1;
    }
    return billingYear;
}

/**
 * Calculate the application year based on the current date.  The rules are as follows:
 *
 * After 8/31, the applications go to the next billing year (now + 1)
 * After 1/1, they go to the current year (now)
 * After 3/1, only special applications are taken (two week temp ones) until 8/31 again.
 *
 * @return number The application's year based on the logic.
 */
export function calculateApplicationYear() : number {
    const rightNow = new Date();
    const rightNowYear = rightNow.getFullYear();
    let applicationyear = rightNowYear;
    if (isAfter(rightNow, (new Date(rightNowYear, 7)))) {
        applicationyear += 1;
    }
    return applicationyear;
}
