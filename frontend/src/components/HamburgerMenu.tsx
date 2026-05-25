import React from 'react';
import {
    Drawer,
    Button,
    IconButton,
    VStack,
    HStack,
    Portal,
    Separator,
} from '@chakra-ui/react';

import {
    AiOutlineMenu, AiFillHome, AiFillCalendar, AiFillBank, AiFillFolderOpen,
    AiOutlineNotification,
} from 'react-icons/ai';
import { HiUsers, HiCog } from 'react-icons/hi';
import { BsCalendarCheck } from 'react-icons/bs';
import { Link } from 'react-router-dom';

import { useAppDisclosure } from '../hooks/useAppDisclosure';

interface pageProps {
    // eslint-disable-next-line react/no-unused-prop-types
    activeButtonId: number,
    admin: boolean,
    boardMember: boolean,
}

export default function HamburgerMenu(props: pageProps) {
    const { isOpen, onOpen, onClose } = useAppDisclosure();
    const btnBg = (id: number) => (props.activeButtonId === id ? 'orange.300' : 'white');
    const btnColor = (id: number) => (props.activeButtonId === id ? 'white' : 'black');
    const adminButtons = (
        <VStack width="100%" gap="0">
            <Separator w="full" borderColor="gray.300" />
            <Button
                justifyContent="flex-start"
                height="80px"
                fontFamily="heading"
                fontSize="xl"
                width="100%"
                bg={btnBg(5)}
                color={btnColor(5)}
                borderRadius="0"
                _hover={{ bg: 'gray.100' }}
                id="5"
            >
                <AiOutlineNotification />
                <Link to="/communicate">Communicate</Link>
            </Button>
            <Separator w="full" borderColor="gray.300" />
            <Button
                justifyContent="flex-start"
                height="80px"
                fontFamily="heading"
                fontSize="xl"
                width="100%"
                bg={btnBg(6)}
                color={btnColor(6)}
                borderRadius="0"
                _hover={{ bg: 'gray.100' }}
                id="6"
            >
                <AiFillBank />
                <Link to="/administration">Club Administration</Link>
            </Button>
            <Separator w="full" borderColor="gray.300" />
        </VStack>
    );
    const boardMemberButtons = (
        <VStack width="100%" gap="0">
            <Button
                justifyContent="flex-start"
                height="80px"
                fontFamily="heading"
                fontSize="xl"
                width="100%"
                bg={btnBg(7)}
                color={btnColor(7)}
                borderRadius="0"
                _hover={{ bg: 'gray.100' }}
                id="7"
            >
                <AiFillFolderOpen />
                <Link to="/early">Billing + Applications</Link>
            </Button>
        </VStack>
    );
    return (
        <HStack paddingLeft={10}>
            <div>
                <IconButton
                    aria-label="Menu"
                    onClick={onOpen}
                    background="orange.300"
                    color="white"
                    borderRadius="full"
                    size="lg"
                >
                    <AiOutlineMenu />
                </IconButton>
                <Drawer.Root
                    open={isOpen}
                    placement="start"
                    size="sm"
                    onOpenChange={
                        (e) => {
                            if (!e.open) {
                                onClose();
                            }
                        }
                    }
                >
                    <Portal>

                        <Drawer.Backdrop />
                        <Drawer.Positioner>
                            <Drawer.Content>
                                <Drawer.Body padding="0">
                                    <VStack width="100%" gap="0">
                                        <Button
                                            justifyContent="flex-start"
                                            height="80px"
                                            fontFamily="heading"
                                            fontSize="xl"
                                            width="100%"
                                            bg={btnBg(1)}
                                            color={btnColor(1)}
                                            borderRadius="0"
                                            _hover={{ bg: 'gray.100' }}
                                            id="1"
                                        >
                                            <AiFillHome />
                                            <Link to="/">Dashboard</Link>
                                        </Button>
                                        <Separator w="full" borderColor="gray.300" />
                                        <Button
                                            justifyContent="flex-start"
                                            height="80px"
                                            fontFamily="heading"
                                            fontSize="xl"
                                            width="100%"
                                            bg={btnBg(2)}
                                            color={btnColor(2)}
                                            _hover={{ bg: 'gray.100' }}
                                            borderRadius="0"
                                            id="2"
                                        >
                                            <AiFillCalendar />
                                            <Link to="/calendar">Calendar and Job Signup</Link>
                                        </Button>
                                        <Separator w="full" borderColor="gray.300" />
                                        <Button
                                            justifyContent="flex-start"
                                            height="80px"
                                            fontFamily="heading"
                                            fontSize="xl"
                                            width="100%"
                                            bg={btnBg(3)}
                                            color={btnColor(3)}
                                            borderRadius="0"
                                            _hover={{ bg: 'gray.100' }}
                                            id="3"
                                        >
                                            <HiUsers />
                                            <Link to="/members">Members</Link>
                                        </Button>
                                        <Separator w="full" borderColor="gray.300" />
                                        <Button
                                            justifyContent="flex-start"
                                            height="80px"
                                            fontFamily="heading"
                                            fontSize="xl"
                                            width="100%"
                                            bg={btnBg(4)}
                                            color={btnColor(4)}
                                            borderRadius="0"
                                            _hover={{ bg: 'gray.100' }}
                                            id="4"
                                        >
                                            <HiCog />
                                            <Link to="/settings">My Account</Link>
                                        </Button>
                                        <Separator w="full" borderColor="gray.300" />
                                        <Button
                                            justifyContent="flex-start"
                                            height="80px"
                                            fontFamily="heading"
                                            fontSize="xl"
                                            width="100%"
                                            bg={btnBg(8)}
                                            color={btnColor(8)}
                                            borderRadius="0"
                                            _hover={{ bg: 'gray.100' }}
                                            id="8"
                                        >
                                            <BsCalendarCheck />
                                            <Link to="/attendance">My Visits</Link>
                                        </Button>
                                    </VStack>
                                    { (props.admin) && (adminButtons) }
                                    { (props.boardMember || props.admin) && (boardMemberButtons)}
                                </Drawer.Body>
                            </Drawer.Content>
                        </Drawer.Positioner>

                    </Portal>
                </Drawer.Root>
            </div>
        </HStack>
    );
}
