import React from 'react';
import { BsCalendarCheck } from 'react-icons/bs';
import { FaStream } from 'react-icons/fa';

import Header from '../components/Header';
import CustomTabPanel from '../components/shared/CustomTabPanel';
import AttendanceHistory from '../components/tabpanels/AttendanceHistory';
import AttendanceLeaderboard from '../components/tabpanels/AttendanceLeaderboard';

function AttendancePage() {
    return (
        <>
            <Header title="Visits" activeButtonId={8} />
            <CustomTabPanel
                tabs={
                    [
                        { label: 'My Visits', icon: <BsCalendarCheck /> },
                        { label: 'Leaderboard', icon: <FaStream /> },
                    ]
                }
                panels={
                    [
                        <AttendanceHistory />,
                        <AttendanceLeaderboard />,
                    ]
                }
            />
        </>
    );
}

export default AttendancePage;
