import { Center, VStack } from '@chakra-ui/react';
import React, { useContext, useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import { AttendanceCount } from '../../../../src/typedefs/attendance';
import { UserContext } from '../../contexts/UserContext';
import { getAttendanceLeaderboard } from '../../controller/attendance';
import DataSearchBox from '../input/DataSearchBox';
import dataTableStyles from '../shared/DataTableStyles';
import YearsDropDown from '../shared/YearsDropDown';

export default function AttendanceLeaderboard() {
    const { state } = useContext(UserContext);
    const [allData, setAllData] = useState<AttendanceCount[]>([]);
    const [filteredData, setFilteredData] = useState<AttendanceCount[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [years, setYears] = useState<number[]>([]);

    async function getLeaderboardData() {
        try {
            const data = await getAttendanceLeaderboard(state.token, year);
            if (!('reason' in data)) {
                setAllData(data);
                setFilteredData(data);
            }
        } catch (error) {
            // squash error
        }
    }

    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const yearList: number[] = [];
        for (let y = currentYear; y >= currentYear - 2; y--) {
            yearList.push(y);
        }
        setYears(yearList);
    }, []);

    useEffect(() => {
        getLeaderboardData();
    }, [year]);

    useEffect(() => {
        if (searchTerm === '') {
            setFilteredData(allData);
        } else {
            const filtered = allData.filter((row: AttendanceCount) => (
                row.memberName.toLowerCase().includes(searchTerm)
            ));
            setFilteredData(filtered);
        }
    }, [searchTerm]);

    const columns: any = [
        {
            name: 'Rank',
            selector: (_row: AttendanceCount, index: number) => index + 1,
            sortable: false,
            maxWidth: '80px',
        },
        {
            name: 'Member',
            selector: (row: AttendanceCount) => row.memberName,
            sortable: true,
        },
        {
            name: 'Check-ins',
            selector: (row: AttendanceCount) => row.checkInCount,
            sortable: true,
        },
    ];

    return (
        <VStack mt={25}>
            <Center>
                <YearsDropDown
                    years={years}
                    initialYear={new Date().getFullYear()}
                    header="Visit Leaders"
                    setYear={setYear}
                />
            </Center>
            <DataSearchBox
                onTextChange={setSearchTerm}
                searchValue={searchTerm}
            />
            <DataTable
                columns={columns}
                data={filteredData}
                customStyles={dataTableStyles()}
                fixedHeaderScrollHeight="300px"
                highlightOnHover
                pagination
                paginationPerPage={20}
                paginationRowsPerPageOptions={[20, (allData?.length || 999)]}
                responsive
                striped
                subHeaderWrap
            />
        </VStack>
    );
}
