import React from 'react';
import GaugeChart from 'react-gauge-chart';
import { Box, Center, Text, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

interface cardProps {
    percent: number,
    year: number,
}

export default function WorkPointsCard(props: cardProps) {
    const navigate = useNavigate();
    const navigateToWorkPoints = () => {
        const path = '/settings';
        navigate(path);
    };
    let { percent: gaugePercent } = props;
    if (gaugePercent > 100) {
        gaugePercent = 100;
    }

    return (
        <Box
            onClick={navigateToWorkPoints}
            cursor="pointer"
            bg="white"
            boxShadow="md"
            borderWidth="1px"
            borderStyle="solid"
            borderColor="gray.200"
            h="375px"
            p={3}
            m={2}
        >
            <Center>
                <VStack p={0} w="full">
                    <GaugeChart
                        id="gauge-chart"
                        nrOfLevels={25}
                        percent={gaugePercent / 100}
                        colors={['#FF9F46', '#76CE6F']}
                        hideText
                        arcWidth={0.3}
                    />
                    <VStack gap={0}>
                        <Text pt={5} fontSize="xl">You have completed (or signed up for)</Text>
                        <Text color="orange" fontSize="2xl">
                            {props.percent}
                            %
                        </Text>
                        <Text fontSize="xl">{`of ${props.year}'s work points`}</Text>
                        <Text fontSize="xx-small">
                            Any work that you have been paid for is not included in this total.  This also includes
                            work that is signed up for but not completed, which will be removed if it is not completed.
                        </Text>
                    </VStack>
                </VStack>
            </Center>
        </Box>
    );
}
