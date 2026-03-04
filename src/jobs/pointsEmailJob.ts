import fs from 'fs';
import { schedule } from 'node-cron';
import Handlebars from 'handlebars';
import logger from '../logger';
import { getDefaultSettingValue } from '../database/defaultSettings';
import { getBillList } from '../database/billing';
import { Bill } from '../typedefs/bill';
import { MemberCommunication } from '../typedefs/memberCommunication';
import publishCommunicationSqs from '../util/sqspublisher';

export default function startPointsEmailJob() {
    schedule('41 23 15 * *', async () => {
        const templatePath = './src/jobs/pointsEmailTemplate.hbs';
        const templateSource = fs.readFileSync(templatePath, 'utf-8');
        const template = Handlebars.compile(templateSource);
        const billingYear = new Date().getFullYear();
        const billingOn = (
            (await getDefaultSettingValue('BILLING_ENABLED', 'ad6a18d1-d963-11f0-858e-1284e6c74c95')) === 'true'
        );
        logger.info(`Starting billing with billing setting of ${billingOn}`);
        if (billingOn) {
            const billingList: Bill[] = await getBillList({
                year: Number(billingYear),
                membershipStatus: 'active',
            }, 'ad6a18d1-d963-11f0-858e-1284e6c74c95');
            billingList.forEach(async (bill) => {
                const htmlEmail = template(bill);
                const pointsCommunication : MemberCommunication = {
                    subject: `Palmyra Racing Association statement for ${billingYear} season`,
                    mechanism: 'EMAIL',
                    selectedTags: [],
                    senderId: 0,
                    text: htmlEmail,
                    members: [],
                };
                const member = {
                    email: bill.membershipAdminEmail,
                };
                pointsCommunication.members.push(member);
                const sqsResult = await publishCommunicationSqs(pointsCommunication);
                logger.debug(JSON.stringify(sqsResult));
            });
        } else {
            logger.info('Skipped billing statement runs due to setting being turned off.');
        }
    });
}
