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
import { IoIosArrowBack } from 'react-icons/io';
import { Link, useNavigate } from 'react-router-dom';

import { useAppDisclosure } from '../hooks/useAppDisclosure';

interface pageProps {
    // eslint-disable-next-line react/no-unused-prop-types
    activeButtonId: number,
    admin: boolean,
    boardMember: boolean,
}

export default function HamburgerMenu(props: pageProps) {
    const { isOpen, onOpen, onClose } = useAppDisclosure();
    const history = useNavigate();
    const activeButtonStyle = {
        bg: 'white',
        color: 'black',
    };
    const adminButtons = (
        <VStack width="100%" gap="0">
            <Separator borderColor="gray.300" />
            <Button
                justifyContent="flex-start"
                height="80px"
                fontFamily="heading"
                fontSize="xl"
                width="100%"
                bg="white"
                color="black"
                borderRadius="0"
                _hover={{ bg: 'gray.100' }}
                _active={activeButtonStyle}
                id="5"
                data-active
            >
                <AiOutlineNotification />
                <Link to="/communicate">Communicate</Link>
            </Button>
            <Separator borderColor="gray.300" />
            <Button
                justifyContent="flex-start"
                height="80px"
                fontFamily="heading"
                fontSize="xl"
                width="100%"
                bg="white"
                color="black"
                borderRadius="0"
                _hover={{ bg: 'gray.100' }}
                _active={activeButtonStyle}
                id="6"
                data-active
            >
                <AiFillBank />
                <Link to="/administration">Club Administration</Link>
            </Button>
            <Separator borderColor="gray.300" />
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
                bg="white"
                color="black"
                borderRadius="0"
                _hover={{ bg: 'gray.100' }}
                _active={activeButtonStyle}
                id="6"
                data-active
            >
                <AiFillFolderOpen />
                <Link to="/early">Billing + Applications</Link>
            </Button>
        </VStack>
    );
    return (
        <HStack>
            <IconButton
                aria-label="Back"
                color="orange"
                bg="white"
                size="lg"
                onClick={() => history(-1)}
            >
                <IoIosArrowBack size="lg" />
            </IconButton>
            <div>
                <IconButton
                    aria-label="Menu"
                    onClick={onOpen}
                    background="white"
                    color="orange"
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
                                            bg="white"
                                            color="black"
                                            borderRadius="0"
                                            _hover={{ bg: 'gray.100' }}
                                            _active={activeButtonStyle}
                                            id="1"
                                            data-active
                                        >
                                            <AiFillHome />
                                            <Link to="/">Dashboard</Link>
                                        </Button>
                                        <Separator borderColor="gray.300" />
                                        <Button
                                            justifyContent="flex-start"
                                            height="80px"
                                            fontFamily="heading"
                                            fontSize="xl"
                                            width="100%"
                                            bg="white"
                                            color="black"
                                            _hover={{ bg: 'gray.100' }}
                                            _active={activeButtonStyle}
                                            borderRadius="0"
                                            id="2"
                                            data-active
                                        >
                                            <AiFillCalendar />
                                            <Link to="/calendar">Calendar and Job Signup</Link>
                                        </Button>
                                        <Separator borderColor="gray.300" />
                                        <Button
                                            justifyContent="flex-start"
                                            height="80px"
                                            fontFamily="heading"
                                            fontSize="xl"
                                            width="100%"
                                            bg="white"
                                            color="black"
                                            borderRadius="0"
                                            _hover={{ bg: 'gray.100' }}
                                            _active={activeButtonStyle}
                                            id="3"
                                            data-active
                                        >
                                            <HiUsers />
                                            <Link to="/members">Members</Link>
                                        </Button>
                                        <Separator borderColor="gray.300" />
                                        <Button
                                            justifyContent="flex-start"
                                            height="80px"
                                            fontFamily="heading"
                                            fontSize="xl"
                                            width="100%"
                                            bg="white"
                                            color="black"
                                            borderRadius="0"
                                            _hover={{ bg: 'gray.100' }}
                                            _active={activeButtonStyle}
                                            id="4"
                                            data-active
                                        >
                                            <HiCog />
                                            <Link to="/settings">My Account</Link>
                                        </Button>
                                        <Separator borderColor="gray.300" />
                                        <Button
                                            justifyContent="flex-start"
                                            height="80px"
                                            fontFamily="heading"
                                            fontSize="xl"
                                            width="100%"
                                            bg="white"
                                            color="black"
                                            borderRadius="0"
                                            _hover={{ bg: 'gray.100' }}
                                            _active={activeButtonStyle}
                                            id="8"
                                            data-active
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
