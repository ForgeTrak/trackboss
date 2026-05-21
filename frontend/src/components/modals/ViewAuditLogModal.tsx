import React from 'react';
import { Button, Grid, GridItem, Heading, Text, Code, Separator } from '@chakra-ui/react';
import AppModal, { AppModalBody, AppModalFooter } from '../AppModal';

interface ViewAuditLogModalProps {
    auditLog?: any,
    isOpen: boolean,
    onClose: () => void,
}

export default function ViewAuditLogModal(props: ViewAuditLogModalProps) {
    return (
        <AppModal size="xl" isOpen={props.isOpen} onClose={props.onClose}>
            <Heading
                textAlign="center"
            >
                Audit Log Details
            </Heading>
            <Separator />
            <AppModalBody>
                <Grid columnGap={4} rowGap={4} templateColumns="repeat(3, 1fr)">
                    <GridItem colSpan={1}>
                        <Text fontWeight="bold">Action</Text>
                        <Text>{props.auditLog?.user_action || 'N/A'}</Text>
                    </GridItem>
                    <GridItem colSpan={1}>
                        <Text fontWeight="bold">Entity Type</Text>
                        <Text>{props.auditLog?.entity_type || 'N/A'}</Text>
                    </GridItem>
                    <GridItem colSpan={1}>
                        <Text fontWeight="bold">Entity ID</Text>
                        <Text>{props.auditLog?.entity_id || 'N/A'}</Text>
                    </GridItem>
                    <GridItem colSpan={3}>
                        <Text fontWeight="bold" mb={2}>Change Details</Text>
                        <Code
                            display="block"
                            whiteSpace="pre-wrap"
                            p={4}
                            borderRadius="md"
                            width="100%"
                            maxHeight="400px"
                            overflowY="auto"
                        >
                            {
                                props.auditLog?.change_details
                                    ? JSON.stringify(
                                        Array.isArray(props.auditLog.change_details)
                                            ? props.auditLog.change_details.map((item: any) => {
                                                if (item && typeof item === 'object' && 'members' in item) {
                                                    const { members, ...rest } = item;
                                                    return rest;
                                                }
                                                return item;
                                            })
                                            : props.auditLog.change_details,
                                        null,
                                        2,
                                    )
                                    : 'N/A'
                            }
                        </Code>
                    </GridItem>
                </Grid>
            </AppModalBody>
            <AppModalFooter>
                <Button backgroundColor="white" onClick={props.onClose}>
                    Close
                </Button>
            </AppModalFooter>
        </AppModal>
    );
}
ViewAuditLogModal.defaultProps = {
    auditLog: undefined,
};
