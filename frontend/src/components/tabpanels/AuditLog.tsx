import React, { useContext, useEffect, useState } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { UserContext } from '../../contexts/UserContext';
import { apiRequest } from '../../controller/utils';

function AuditLog() {
    const { state } = useContext(UserContext);

    const [auditLogData, setAuditLogData] = useState<any>();

    async function getAuditLogData() {
        let allAuditLogs : any[] = [];
        try {
            allAuditLogs = await apiRequest(state.token, 'GET', '/api/auditLog') as any[];
        } catch (error) {
            // console.log(error);
        }
        setAuditLogData(allAuditLogs);
    }

    useEffect(() => {
        getAuditLogData();
    }, []);

    return (
        <Box>
            <Text fontSize="2xl" mb={4}>Audit Log</Text>
            <Text fontSize="sm" mb={4}>Audit log is a new feature, and this interface will change</Text>
            <Text fontSize="xs">Audit log only shows data for events after March, 2025.</Text>
            {
                auditLogData ? (
                    auditLogData.map((log: any) => (
                        <Box key={log.id} borderWidth="1px" borderRadius="lg" p={4} mb={4}>
                            <Text>
                                <strong>Action:</strong>
                                {log.user_action}
                            </Text>
                            <Text>
                                <strong>Entity Type:</strong>
                                {log.entity_type}
                            </Text>
                            <Text>
                                <strong>Entity ID:</strong>
                                {log.entity_id}
                            </Text>
                            <Text>
                                <strong>User ID:</strong>
                                {`${log.last_name}, ${log.first_name}`}
                            </Text>
                            <Text>
                                <strong>Timestamp:</strong>
                                {log.created_at}
                            </Text>
                            <Text>
                                <strong>Change:</strong>
                                {log.change_details ? JSON.stringify(log.change_details) : 'N/A'}
                            </Text>
                        </Box>
                    ))
                ) : (
                    <Text>No audit log data available.</Text>
                )
            }
        </Box>
    );
}

export default AuditLog;
