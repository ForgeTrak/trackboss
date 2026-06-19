import React, { useEffect, useState } from 'react';
import { AbsoluteCenter, Box, Center, ProgressCircle, Text, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

interface cardProps {
    percent: number,
    year: number,
    earned: number,
    threshold: number,
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

    const [displayValue, setDisplayValue] = useState(0);
    useEffect(() => {
        const duration = 2200;
        const start = performance.now();
        let frame: number;
        const c1 = 1.70158;
        const c3 = c1 + 1;
        const tick = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
            const next = Math.min(Math.max(Math.round(gaugePercent * eased), 0), 100);
            setDisplayValue(next);
            if (t < 1) {
                frame = requestAnimationFrame(tick);
            }
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [gaugePercent]);

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
                <VStack p={0} w="100%">
                    <Box w="100%" maxW="500px" display="flex" justifyContent="center" py={2}>
                        <ProgressCircle.Root value={displayValue}>
                            <svg width="0" height="0">
                                <defs>
                                    <linearGradient id="workPointsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#FF9F46" />
                                        <stop offset="100%" stopColor="#76CE6F" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <ProgressCircle.Circle css={{ '--size': '180px', '--thickness': '18px' }}>
                                <ProgressCircle.Track stroke="gray.100" />
                                <ProgressCircle.Range
                                    stroke="url(#workPointsGradient)"
                                    strokeLinecap="round"
                                    transitionProperty="none"
                                />
                            </ProgressCircle.Circle>
                            <AbsoluteCenter>
                                <ProgressCircle.ValueText fontSize="3xl" fontWeight="bold" color="gray.700" />
                            </AbsoluteCenter>
                        </ProgressCircle.Root>
                    </Box>
                    <VStack gap={0}>
                        <Text pt={5} fontSize="xl">You have completed (or signed up for)</Text>
                        <Text color="orange" fontSize="2xl">
                            {`${props.earned} of ${props.threshold}`}
                            {` (${props.percent}%)`}
                        </Text>
                        <Text fontSize="xl">{`of ${props.year}'s work points`}</Text>
                        <Text fontSize="xx-small">
                            Any work that you have been paid for is not included in this total. For details on your points
                            please see My Account.
                        </Text>
                    </VStack>
                </VStack>
            </Center>
        </Box>
    );
}
