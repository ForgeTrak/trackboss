import React, { useContext } from 'react';
import {
    Center,
    Heading,
    Highlight,
    Text,
    VStack,
} from '@chakra-ui/react';
import { useAppDisclosure } from '../hooks/useAppDisclosure';
import { Bill } from '../../../src/typedefs/bill';
import DuesAndWaiversModal from './modals/DuesAndWaiversModal';
import { UserContext } from '../contexts/UserContext';

interface pageProps {
    name: string,
    billYear: number,
    gateCode?: string,
    // eslint-disable-next-line react/no-unused-prop-types
    lastBill?: Bill,
}

export default function Header(props: pageProps) {
    const { billYear, lastBill } = props;
    const { isOpen, onClose, onOpen } = useAppDisclosure();
    const { state } = useContext(UserContext);

    const allDone = (lastBill?.curYearPaid && lastBill.curYearIns);
    let status = (allDone) ? 'complete' : 'incomplete';
    let highlightColor = 'green';
    if (!allDone) {
        highlightColor = 'red';
        if (!lastBill?.curYearPaid && !lastBill?.curYearIns) {
            status += '(payment, insurance)';
        } else if (!lastBill.curYearPaid) {
            status += '(payment)';
        } else if (!lastBill?.curYearIns) {
            status += '(insurance)';
        }
    }
    const gateCodeMessage = `Current gate code: ${props.gateCode}`;
    return (
        <Center>
            <VStack>
                <Heading size="2xl">
                    Hi, {/*eslint-disable-line*/}
                    <Heading sx={{ display: 'inline' }} color="orange" size="2xl">
                        {props.name}
                    </Heading>
                </Heading>
                <Text
                    fontSize="xl"
                    cursor="pointer"
                    onClick={
                        () => {
                            onOpen();
                        }
                    }
                >
                    <Highlight
                        query={['complete', 'incomplete']}
                        styles={{ px: '2', py: '1', rounded: 'full', color: 'white', bg: highlightColor }}
                    >
                        {`${billYear + 1} renewal status (view): ${status}`}
                    </Highlight>
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="orange">
                    {gateCodeMessage}
                </Text>
            </VStack>
            <DuesAndWaiversModal
                viewBill={lastBill}
                token={state.token}
                insuranceAttested={lastBill?.curYearIns || false}
                isOpen={isOpen}
                onClose={
                    async () => {
                        onClose();
                    }
                }
            />
        </Center>
    );
}
Header.defaultProps = {
    gateCode: '',
    lastBill: undefined,
};
