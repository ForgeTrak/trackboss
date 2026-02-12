import React from 'react';
import { AiFillFolderOpen } from 'react-icons/ai';
import { FaMoneyBillAlt } from 'react-icons/fa';

import Header from '../components/Header';
import CustomTabPanel from '../components/shared/CustomTabPanel';
import DuesAndWaiversList from '../components/shared/DuesAndWaiversList';
import MembershipApplicationList from '../components/MembershipApplicationList';

function EarlySeasonPage() {
    return (
        <>
            <Header title="Billing and Applications" activeButtonId={7} />
            <CustomTabPanel
                tabs={
                    [
                        { label: 'Dues/Waivers', icon: <FaMoneyBillAlt /> },
                        { label: 'Membership Applications', icon: <AiFillFolderOpen /> },
                    ]
                }
                panels={[<DuesAndWaiversList />, <MembershipApplicationList />]}
            />
        </>
    );
}

export default EarlySeasonPage;
