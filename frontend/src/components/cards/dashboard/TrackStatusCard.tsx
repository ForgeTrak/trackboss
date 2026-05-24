import React from 'react';
import { Box, Heading, HStack, SimpleGrid, Switch, Text, VStack, Separator } from '@chakra-ui/react';
import { RidingAreaStatus } from '../../../../../src/typedefs/ridingAreaStatus';

interface cardProps {
    areaStatusList: RidingAreaStatus[],
    isAdmin: boolean,
    // this param is here for clarity, so I disabled the eslint rule since it doesn't make sense here.
    // eslint-disable-next-line no-unused-vars
    updateArea: (updatedArea: RidingAreaStatus) => void,
}

export default function TrackStatusCard(props: cardProps) {
    const { areaStatusList, isAdmin } = props;

    const ridingAreaDisplay = areaStatusList.map((area) => {
        let color = '';
        if (area.isOpen) {
            color = 'green';
        } else {
            color = 'red';
        }
        return (
            <Box p={2} borderWidth="1px" borderRadius="lg" bgColor={color} color="white" w="100%">
                <Text fontSize="xl" fontWeight="bold">
                    {area.name}
                </Text>
                {
                    isAdmin && (
                        <Switch.Root
                            colorPalette="orange"
                            size="lg"
                            defaultChecked={area.isOpen}
                            onCheckedChange={
                                async () => {
                                    area.isOpen = !area.isOpen;
                                    await props.updateArea(area);
                                }
                            }
                        >
                            <Switch.HiddenInput />
                            <Switch.Control>
                                <Switch.Thumb />
                            </Switch.Control>
                        </Switch.Root>
                    )
                }
            </Box>
        );
    });
    return (
        <Box
            alignSelf="center"
            bg="white"
            boxShadow="md"
            borderWidth="1px"
            borderStyle="solid"
            borderColor="gray.200"
            w={['100%', '100%', 1498]}
            p={2}
            m={2}
        >
            <VStack align="left" gap="2em">
                <Heading alignContent="left" size="lg">Track Status</Heading>
                <Separator />
                <HStack>
                    <SimpleGrid w="100%" columns={[1, null, 3]} gap="20px">
                        {ridingAreaDisplay}
                    </SimpleGrid>
                </HStack>
            </VStack>
        </Box>
    );
}
