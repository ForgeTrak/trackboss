import { v4 } from 'uuid';
import { SquareClient } from 'square';
import { Bill } from '../typedefs/bill';
import logger from '../logger';
import { getDefaultSettingValue } from '../database/defaultSettings';

export default async function createPaymentLink(memberBill: Bill) {
    const token = await getDefaultSettingValue('SQUARE_TOKEN', memberBill.tenantId);
    const locationId = await getDefaultSettingValue('SQUARE_LOCATION', memberBill.tenantId);

    // Set Square credentials and environment
    const client = new SquareClient({
        token,
    });

    try {
        const start = Date.now();
        // Square uses cents for payment so we convert here.  and force two decimal places becuase the
        // calculation gets jacked up otherwise.
        const paymentAmount = (memberBill.amountWithFee * 100).toFixed(0);

        const response = await client.checkout.paymentLinks.create({
            idempotencyKey: v4(),
            order: {
                locationId,
                referenceId: memberBill.billId.toString(),
                lineItems: [
                    {
                        // eslint-disable-next-line max-len
                        name: `Palmyra Racing Association - ${memberBill.membershipAdmin} dues for ${memberBill.year + 1} season`,
                        quantity: '1',
                        note: memberBill.membershipAdmin,
                        basePriceMoney: {
                            amount: BigInt(paymentAmount),
                            currency: 'USD',
                        },
                    },
                ],
            },
            checkoutOptions: {
                allowTipping: false,
                merchantSupportEmail: 'hogbacksecretary@gmail.com',
                acceptedPaymentMethods: {
                    googlePay: true,
                    applePay: true,
                    afterpayClearpay: true,
                },
            },
            prePopulatedData: {
                buyerEmail: memberBill.membershipAdminEmail,
                buyerPhoneNumber: memberBill.phone,
                // Names don't go in buyerAddress anymore — Square may ignore or reject
                // You could use "buyerNote" if you want to carry forward the name
            },
        });

        return {
            squareUrl: response?.paymentLink?.url,
            squareOrderId: response?.paymentLink?.orderId,
        };
    } catch (error) {
        logger.error('square - Error creating payment link', { memberBill, error });
        throw (error);
    }
}
