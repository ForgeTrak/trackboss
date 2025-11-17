import { schedule } from 'node-cron';
import { getDefaultSettingValue } from '../database/defaultSettings';
import { getMembershipList } from '../database/membership';
import { generateSquareLinks, runBillingComplete } from '../util/billing';
import logger from '../logger';

export default function startBillingJob() {
    schedule('30 22 * * *', async () => {
        const billingYear = new Date().getFullYear();
        const billingOn = ((await getDefaultSettingValue('BILLING_ENABLED')) === 'true');
        logger.info(`Starting billing with billing setting of ${billingOn}`);
        if (billingOn) {
            const membershipList = await getMembershipList('active');
            logger.info(`Running billing for year ${billingYear} and ${membershipList.length} memberships`);
            const generatedBills = await runBillingComplete(billingYear, membershipList);
            logger.debug(JSON.stringify(generatedBills));
            // in November, generate billing links for next year
            if (new Date().getMonth() === 10) {
                await generateSquareLinks(billingYear);
            }
        } else {
            logger.info('Skipped billing run due to setting being turned off.');
        }
    });
}
