import React, { useContext } from 'react';
import { Heading, Flex, Spacer, Box, Text, Button } from '@chakra-ui/react';

import { useNavigate } from 'react-router-dom';
import HamburgerMenu from './HamburgerMenu';
import { UserContext } from '../contexts/UserContext';
import { buildOAuthState } from '../util/oauthState';

interface pageProps {
    title: string;
    activeButtonId: number;
}

export default function Header(props:pageProps) {
    const { state, update } = useContext(UserContext);

    const navigate = useNavigate();
    const navigateToMembers = () => {
        const path = '/members';
        navigate(path);
    };
    let loggedInAs = `Logged in as ${state?.user?.firstName} ${state?.user?.lastName}`;
    if (state.storedUser) {
        loggedInAs = `Logged in as ${state.storedUser.firstName} ${state.storedUser.lastName} 
            (acting as ${state.user?.firstName} ${state.user?.lastName})`;
    }
    return (
        <div>
            <Flex bg="white" boxShadow="lg" padding="4">
                <HamburgerMenu
                    activeButtonId={props.activeButtonId}
                    admin={state.user?.memberType === 'Admin'}
                    boardMember={state.user?.isBoardMember || false}
                />
                <Spacer />
                <Box>
                    <Heading pr={90} size="md">{`Trackboss: ${props.title}`}</Heading>
                    <Text fontSize="sm">Powered by ForgeTrak</Text>
                    <Text fontSize="xs">{`${loggedInAs}`}</Text>
                    <Text fontSize="xs">{`Tenant ID: ${state.user?.tenantId}`}</Text>
                </Box>
                <Spacer />
                <Button
                    backgroundColor="white"
                    onClick={
                        () => {
                            localStorage.removeItem('trackboss_auth_token');
                            update({ loggedIn: false, token: '', user: undefined, storedUser: undefined, isInitializing: false });
                            const { VITE_AUTH_URL, VITE_CLIENT_ID, VITE_CALLBACK_URL } = import.meta.env;
                            const { origin } = window.location;
                            const encodedState = buildOAuthState({ origin });
                            // eslint-disable-next-line max-len
                            const authTarget = `${VITE_AUTH_URL}/login?client_id=${VITE_CLIENT_ID}&state=${encodedState}&response_type=code&scope=email+openid+phone&redirect_uri=${VITE_CALLBACK_URL}`;
                            window.location.href = authTarget;
                        }
                    }
                >
                    Logout
                </Button>
            </Flex>
            {
                state.storedUser !== undefined && (
                    <Flex height={50} backgroundColor="red">
                        <Text
                            mt={2}
                            ml={10}
                            fontWeight="bold"
                            color="white"
                            fontSize="md"
                        >
                            Acting as:
                            {' '}
                            { `${state.user?.firstName} ${state.user?.lastName}`}
                        </Text>
                        <Spacer />
                        <Button
                            mt={1.5}
                            ml={15}
                            mr={10}
                            size="md"
                            variant="outline"
                            color="white"
                            onClick={
                                () => {
                                    navigateToMembers();
                                    const originalUser = state.storedUser;
                                    // Return to the original user, and clear the storedUser
                                    update({
                                        loggedIn: true,
                                        token: state.token,
                                        user: originalUser,
                                        storedUser: undefined,
                                        isInitializing: false,
                                    });
                                }
                            }
                        >
                            {`RETURN TO YOUR PROFILE (${state.storedUser.firstName} ${state.storedUser.lastName})`}
                        </Button>
                    </Flex>
                )
            }
        </div>
    );
}
