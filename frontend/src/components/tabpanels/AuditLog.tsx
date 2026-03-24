import React, { useContext, useEffect, useState } from 'react';
import { Box, Text } from '@chakra-ui/react';
import DataTable from 'react-data-table-component';
import { UserContext } from '../../contexts/UserContext';
import { apiRequest } from '../../controller/utils';
import dataTableStyles from '../shared/DataTableStyles';
import { useAppDisclosure } from '../../hooks/useAppDisclosure';
import ViewAuditLogModal from '../modals/ViewAuditLogModal';

function AuditLog() {
    const { state } = useContext(UserContext);

    const [auditLogData, setAuditLogData] = useState<any[]>([]);
    const [selectedLog, setSelectedLog] = useState<any>();
    const { isOpen, onOpen, onClose } = useAppDisclosure();

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

    const truncateJson = (data: any) => {
        if (!data) return 'N/A';
        const displayData = Array.isArray(data)
            ? data.map((item) => {
                if (item && typeof item === 'object' && 'members' in item) {
                    const { members, ...rest } = item;
                    return rest;
                }
                return item;
            })
            : data;
        const str = JSON.stringify(displayData);
        return str.length > 100 ? `${str.substring(0, 100)}...` : str;
    };

    const columns: any = [
        {
            name: 'Timestamp',
            selector: (row: any) => row.created_at,
            sortable: true,
            id: 'timestamp',
            maxWidth: '15%',
        },
        {
            name: 'User',
            selector: (row: any) => `${row.last_name}, ${row.first_name}`,
            sortable: true,
            maxWidth: '15%',
        },
        {
            name: 'Action',
            selector: (row: any) => row.user_action,
            sortable: true,
            maxWidth: '10%',
        },
        {
            name: 'Entity Type',
            selector: (row: any) => row.entity_type,
            sortable: true,
            maxWidth: '15%',
        },
        {
            name: 'Entity ID',
            selector: (row: any) => row.entity_id,
            sortable: true,
            maxWidth: '10%',
        },
        {
            name: 'Change Details (Click row to view)',
            selector: (row: any) => truncateJson(row.change_details),
            sortable: false,
            wrap: true,
        },
    ];

    return (
        <Box>
            <Text fontSize="2xl" mb={4}>Audit Log</Text>
            <Text fontSize="sm">Audit log only shows data for events after March, 2025.</Text>
            <Box mt={4}>
                <DataTable
                    columns={columns}
                    data={auditLogData}
                    customStyles={dataTableStyles()}
                    fixedHeaderScrollHeight="500px"
                    highlightOnHover
                    pagination
                    paginationPerPage={50}
                    paginationRowsPerPageOptions={[50, (auditLogData?.length || 999)]}
                    responsive
                    striped
                    subHeaderWrap
                    defaultSortFieldId="timestamp"
                    defaultSortAsc={false}
                    noDataComponent={<Text mt={4}>No audit log data available.</Text>}
                    onRowClicked={
                        (row: any) => {
                            setSelectedLog(row);
                            onOpen();
                        }
                    }
                />
            </Box>
            <ViewAuditLogModal
                auditLog={selectedLog}
                isOpen={isOpen}
                onClose={onClose}
            />
        </Box>
    );
}

export default AuditLog;
