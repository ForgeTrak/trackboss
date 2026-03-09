import { schedule } from 'node-cron';
import { getDefaultSettingValue } from '../database/defaultSettings';
import { getMembershipList } from '../database/membership';
import { generateSquareLinks, runBillingComplete } from '../util/billing';
import logger from '../logger';

export default function startBillingJob() {
    schedule('00 11 * * *', async () => {
        const billingYear = new Date().getFullYear();
        const billingTenant = 'ad6a18d1-d963-11f0-858e-1284e6c74c95';
        const billingOn = (
            (await getDefaultSettingValue('BILLING_ENABLED', billingTenant)) === 'true'
        );
        logger.info(`billing - Starting billing with billing setting of ${billingOn}`);
        if (billingOn) {
            const membershipList = await getMembershipList('active', billingTenant);
            logger.info(`billing - Running billing for year ${billingYear} and ${membershipList.length} memberships`);
            const generatedBills = await runBillingComplete(billingYear, membershipList, undefined, billingTenant);
            logger.debug(JSON.stringify(generatedBills));
            logger.info(`billing - Finished billing for year ${billingYear} and ${generatedBills.length} bills.`);
            // in November, generate billing links for next year
            const month = new Date().getMonth() + 1;
            if ((month >= 11) || (month <= 2)) {
                await generateSquareLinks(billingYear, undefined, billingTenant);
            }
        } else {
            logger.info('billing - Skipped billing run due to setting being turned off.');
        }
    });
}
