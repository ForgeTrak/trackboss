/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { Box, Link, Heading, VStack, Center, Separator, List } from '@chakra-ui/react';
import { Link as DashboardLink } from '../../../../../src/typedefs/link';
import { API_BASE } from '../../../controller/utils';

interface cardProps {
    dashboardLinks: DashboardLink[],
    jwt: string,
}

export default function ImportantLinksCard(props: cardProps) {
    return (
        <Box bg="white" boxShadow="md" borderWidth="1px" borderStyle="solid" borderColor="gray.200" p={2} h="375px" m={2}>
            <VStack w="full" alignItems="left" px={4}>
                <Center>
                    <Heading size="lg">Club Info and Links</Heading>
                </Center>
                <Separator w="full" borderColor="gray.200" />
                <List.Root as="ul" pl={6} css={{ '& li::marker': { color: 'orange' } }}>
                    <List.Item key="printable-calendar" pt={1} color="orange">
                        <Link
                            href={`${API_BASE}/api/event/calendar/excel?id=${encodeURIComponent(props.jwt)}`}
                            target="_blank"
                            fontSize="2xl"
                            color="orange"
                        >
                            Printable Calendar
                        </Link>
                    </List.Item>
                    {
                        // eslint-disable-next-line arrow-body-style
                        props.dashboardLinks.map((link: DashboardLink) => {
                            const displayLink = (
                                <List.Item key={link.linkUrl} pt={1} color="orange">
                                    <Link
                                        href={link.linkUrl}
                                        target="_blank"
                                        fontSize="2xl"
                                        color="orange"
                                    >
                                        {link.linkTitle}
                                    </Link>
                                </List.Item>
                            );
                            return displayLink;
                        })
                    }
                </List.Root>
            </VStack>
        </Box>
    );
}
