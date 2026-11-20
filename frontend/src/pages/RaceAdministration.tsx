import React from 'react';
import { BsTools } from 'react-icons/bs';
import { FaLink, FaMoneyCheck, FaTeamspeak } from 'react-icons/fa';

import Header from '../components/Header';
import EventSignupSheet from '../components/EventSignupSheet';
import PaidLaborList from '../components/PaidLaborList';
import LinkList from '../components/LinkList';
import CustomTabPanel from '../components/shared/CustomTabPanel';
import SiteSettings from '../components/tabpanels/SiteSettings';
import AuditLog from '../components/tabpanels/AuditLog';

function RaceAdministration() {
    return (
        <>
            <Header title="Club Administration" activeButtonId={6} />
            <CustomTabPanel
                tabs={
                    [
                        { label: 'Event Job Structure', icon: <FaTeamspeak /> },
                        { label: 'Paid Labor', icon: <FaMoneyCheck /> },
                        { label: 'Important Links', icon: <FaLink /> },
                        { label: 'Site Settings', icon: <BsTools /> },
                        { label: 'Audit Log', icon: <BsTools /> },
                    ]
                }
                panels={
                    [
                        <EventSignupSheet />,
                        <PaidLaborList />,
                        <LinkList />,
                        <SiteSettings />,
                        <AuditLog />,
                    ]
                }
            />
        </>
    );
}

export default RaceAdministration;
