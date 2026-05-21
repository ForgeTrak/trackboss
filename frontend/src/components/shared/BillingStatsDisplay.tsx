import { Box, HStack, Link, Stat } from '@chakra-ui/react';
import React from 'react';
import { Bill } from '../../../../src/typedefs/bill';

interface billStatsProps {
    bill?: Bill,
}
export default function BillingStatsDisplay(props: billStatsProps) {
    const { bill } = props;

    return (
        <Box>
            <HStack>
                <Stat.Root>
                    <Stat.ValueText>
                        {bill?.membershipType}
                    </Stat.ValueText>
                    <Stat.Label>
                        Points Earned in &nbsp;
                        {bill?.year}
                    </Stat.Label>
                    <Stat.ValueText>
                        {bill?.pointsEarned}
                        &nbsp;
                    </Stat.ValueText>
                    <Stat.HelpText>
                        of
                        &nbsp;
                        {bill?.pointsThreshold}
                    </Stat.HelpText>
                </Stat.Root>
                <Stat.Root>
                    <Stat.Label>
                        Amount Due
                    </Stat.Label>
                    <Stat.ValueText>
                        {`$${bill?.amount}`}
                    </Stat.ValueText>
                    <Stat.HelpText>
                        {`$${bill?.amountWithFee} w/ Square`}
                    </Stat.HelpText>
                </Stat.Root>
            </HStack>
            <Stat.Root>
                <Stat.Label>
                    Bill generated on
                </Stat.Label>
                <Stat.HelpText>
                    {`${bill?.generatedDate}`}
                </Stat.HelpText>
            </Stat.Root>
            <Link
                href={bill?.squareLink}
                target="_blank"
            >
                Square link
            </Link>
        </Box>
    );
}
BillingStatsDisplay.defaultProps = {
    bill: undefined,
};
