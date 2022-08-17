import React from 'react';
import { Box, Divider, Heading, HStack, SimpleGrid, Switch, Text, VStack } from '@chakra-ui/react';
import { RidingAreaStatus } from '../../../src/typedefs/ridingAreaStatus';

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
                <Text fontSize="xl" fontStyle="bold">
                    {area.name}
                </Text>
                {
                    isAdmin && (
                        <Switch
                            colorScheme="orange"
                            size="lg"
                            defaultChecked={area.isOpen}
                            onChange={
                                async () => {
                                    area.isOpen = !area.isOpen;
                                    await props.updateArea(area);
                                }
                            }
                        />
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
            border="1px"
            borderColor="gray.200"
            w={[470, 470, 1494]}
            p={2}
        >
            <VStack align="left" spacing="2em">
                <Heading alignContent="left" size="lg">Track Status</Heading>
                <Divider />
                <HStack>
                    <SimpleGrid w="100%" columns={[1, null, 3]} spacing="20px">
                        {ridingAreaDisplay}
                    </SimpleGrid>
                </HStack>
            </VStack>
        </Box>
    );
}
