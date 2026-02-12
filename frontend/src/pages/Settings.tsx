import React from 'react';
import Header from '../components/Header';
import AccountPageTabs from '../components/AccountPageTabs';

function Settings() {
    return (
        <>
            <Header title="My Account" activeButtonId={4} />
            <AccountPageTabs />
        </>
    );
}

export default Settings;
