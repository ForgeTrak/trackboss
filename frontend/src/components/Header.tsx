import React, { useContext } from 'react';
import {
    Heading,
    Flex,
    Spacer,
    Box,
    Button,
    Text,
} from '@chakra-ui/react';

import { useNavigate } from 'react-router-dom';
import HamburgerMenu from './HamburgerMenu';
import { UserContext } from '../contexts/UserContext';

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

    return (
        <div>
            <Flex bg="white" boxShadow="lg" padding="6">
                <HamburgerMenu
                    activeButtonId={props.activeButtonId}
                    admin={state.user?.memberType === 'Admin'}
                    boardMember={state.user?.isBoardMember || false}
                />
                <Spacer />
                <Box>
                    <Heading pr={90} size="lg">{props.title}</Heading>
                </Box>
                <Spacer />
            </Flex>
            {
                state.storedUser !== undefined && (
                    <Flex height={50} backgroundColor="red">
                        <Text
                            mt={2}
                            ml={10}
                            fontStyle="bold"
                            color="white"
                            fontSize="xl"
                        >
                            Currently acting as:
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
