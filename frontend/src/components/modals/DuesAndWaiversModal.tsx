/* eslint-disable max-len */
import React, { useContext, useState } from 'react';
import {
    Box,
    Button, Divider, Heading, Modal, ModalContent, ModalFooter, ModalOverlay,
} from '@chakra-ui/react';
import { Bill } from '../../../../src/typedefs/bill';
import { UserContext } from '../../contexts/UserContext';

import { attestInsurance } from '../../controller/billing';
import WrappedSwitchInput from '../input/WrappedSwitchInput';
import BillingStatsDisplay from '../shared/BillingStatsDisplay';

interface duesModalProps {
    isOpen: boolean,
    // eslint-disable-next-line react/no-unused-prop-types
    token: string,
    // eslint-disable-next-line react/require-default-props
    viewBill?: Bill;
    insuranceAttested: boolean,
    onClose: () => void,
}

export default function DuesAndWaiversModal(props: duesModalProps) {
    const { state } = useContext(UserContext);

    const billingYear = props.viewBill?.year || new Date().getFullYear();

    const [insuranceAttested, setInsuranceAttested] = useState<boolean>(props.viewBill?.curYearIns || false);

    const attested = (props.insuranceAttested || insuranceAttested);

    const currentTime = new Date().getTime();

    // months are zero based, so January is 0, November is 10, December is 11, and there is no 12. I can never remember
    // this fun fact and always mess it up, so making this note here next time I need this.
    const startOfBillingPeriod = new Date(billingYear, 10, 21).getTime();

    // after billing ends, we also don't allow them to pay so lock that as well.
    const endOfBillingPeriod = new Date((billingYear + 1), 0, 21).getTime();

    const insideRenewalPeriod = ((currentTime > startOfBillingPeriod) && (currentTime < endOfBillingPeriod));
    const paid = props.viewBill?.curYearPaid;

    const isRenewalAllowed = ((insideRenewalPeriod) || (paid && attested));

    let renewalAttestationComponent;

    let renewalPaymentComponent = (
        <>
            <Box>
                {`Renewal and payment options are available from December 1st, ${billingYear} to Febuary 1st, ${billingYear + 1}`}
            </Box>
            <Box>
                <Button
                    variant="outline"
                    size="lg"
                    bgColor="orange.300"
                    color="white"
                    onClick={
                        () => {
                            props.onClose();
                        }
                    }
                >
                    Close
                </Button>
            </Box>
        </>
    );
    if (isRenewalAllowed) {
        renewalAttestationComponent = (
            <>
                <Box mb={1}>
                    By clicking this box, I attest that I have, and will maintain, valid health insurance for the
                    {` ${billingYear + 1} season.  I agree to notify PRA of any change in my insurance status.`}
                    <p />
                    I also agree to the PRA sound rule and code of conduct found PRA member rules and code of conduct
                    found on the Track Boss Dashboard.
                </Box>
                <WrappedSwitchInput
                    wrapperText="(Payment options appear after you agree to this if applicable)"
                    defaultChecked={attested}
                    onSwitchChange={
                        async () => {
                            setInsuranceAttested(true);
                            await attestInsurance(state.token, props.viewBill?.billId || 0);
                        }
                    }
                    maxWidth={400}
                    locked={attested}
                    toastMessage="Insurance attestation has been recorded and will be emailed to you."
                />
            </>
        );
        renewalPaymentComponent = (
            <>
                <Button
                    variant="outline"
                    mr={3}
                    size="lg"
                    color="white"
                    bgColor={attested ? 'green' : 'red'}
                    onClick={
                        async () => {
                            props.onClose();
                        }
                    }
                >
                    {attested ? 'All set!' : 'I\'m not ready'}
                </Button>
                <Button
                    backgroundColor="orange.300"
                    color="white"
                    variant="outline"
                    size="lg"
                    hidden={!attested || (props.viewBill?.amount === 0) || (props.viewBill?.curYearPaid)}
                    onClick={
                        async () => {
                            window.open(`${props.viewBill?.squareLink}`);
                        }
                    }
                >
                    Pay With Square
                </Button>
                <Button
                    ml={2}
                    backgroundColor="orange.300"
                    color="white"
                    variant="outline"
                    size="lg"
                    hidden={!attested || (props.viewBill?.amount === 0) || (props.viewBill?.curYearPaid)}
                    onClick={
                        async () => {
                            // eslint-disable-next-line max-len
                            window.open(`mailto:hogbacksecretary@gmail.com?subject=Dues%20Payment%20for%20${props.viewBill?.firstName}%20${props.viewBill?.lastName}&body=I%20intend%20to%20pay%20my%20dues%20of%20$${props.viewBill?.amount}%20via%20%3CYour%20method%20here%3E%20by%20${props.viewBill?.dueDate}`);
                        }
                    }
                >
                    Pay with cash/check
                </Button>
            </>
        );
    }

    return (
        <Modal isCentered size="lg" isOpen={props.isOpen} onClose={props.onClose}>
            <ModalOverlay />
            <ModalContent>
                <Heading m={3}>
                    {`${billingYear + 1} PRA bill and attestation`}
                </Heading>
                <Box m={3}>
                    <Box mb={2}>
                        Your dues are listed below.  You can pay via mail, in person, or via the Paypal button.
                        If your dues are $0 no payment options are presented as we just need attestation of insurance.
                    </Box>
                    <BillingStatsDisplay bill={props.viewBill} />
                    {renewalAttestationComponent}
                </Box>
                <Divider />
                <ModalFooter>
                    {renewalPaymentComponent}
                </ModalFooter>
            </ModalContent>

        </Modal>
    );
}
