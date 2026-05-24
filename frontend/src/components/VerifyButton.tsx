import { Box, Button } from '@chakra-ui/react';
import React, { useContext, useState } from 'react';

import { setVerifiedState } from '../controller/job';
import { UserContext } from '../contexts/UserContext';

interface buttonProps {
    verified: boolean,
    jobId: number,
    member: string,
}

export default function VerifyButton(props: buttonProps) {
    const { state } = useContext(UserContext);
    const [verified, setVerified] = useState(props.verified);
    const handleClick = () => {
        setVerified(!verified);
        setVerifiedState(state.token, props.jobId, !verified);
    };
    let verifyButton;
    if (props.member && (state.user?.memberType === 'Admin')) {
        verifyButton = (
            <Button
                ml={4}
                bg={verified ? 'green' : 'red'}
                color="white"
                onClick={handleClick}
                disabled={!props.member}
            >
                {verified ? 'Verified' : 'Verify'}
            </Button>
        );
    } else {
        verifyButton = (
            <Box />
        );
    }
    return verifyButton;
}
