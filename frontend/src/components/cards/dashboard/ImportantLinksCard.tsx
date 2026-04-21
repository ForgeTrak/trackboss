/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { Box, ListItem, Link, UnorderedList, Heading, VStack, Divider, Center } from '@chakra-ui/react';
import { Link as DashboardLink } from '../../../../../src/typedefs/link';

interface cardProps {
    dashboardLinks: DashboardLink[],
    memberId: number,
    jwt: string,
}

export default function ImportantLinksCard(props: cardProps) {
    return (
        <Box bg="white" boxShadow="md" border="1px" borderColor="gray.200" p={2} h="375" m={2}>
            <VStack boxSize="md" alignItems="left" ml={4}>
                <Center>
                    <Heading size="lg">Club Info and Links</Heading>
                </Center>
                <Divider />
                <UnorderedList>
                    {
                        // eslint-disable-next-line arrow-body-style
                        props.dashboardLinks.map((link: DashboardLink) => {
                            const displayLink = (
                                <Link
                                    href={link.linkUrl}
                                    target="_blank"
                                    fontSize="2xl"
                                    color="orange"
                                >
                                    <ListItem pt={1}>{link.linkTitle}</ListItem>
                                </Link>
                            );
                            return displayLink;
                        })
                    }
                </UnorderedList>
            </VStack>
        </Box>
    );
}
