import React, { useContext } from 'react';
import { ExpanderComponentProps } from 'react-data-table-component';
import { Box, Button, Group } from '@chakra-ui/react';
import { BsTrash2 } from 'react-icons/bs';

import { useAppDisclosure } from '../hooks/useAppDisclosure';
import { deleteLink } from '../controller/links';
import { UserContext } from '../contexts/UserContext';
import { Link } from '../../../src/typedefs/link';
import LinkModal from './modals/LinkModal';

interface LinkRowProps extends ExpanderComponentProps<Link> {
    // eslint-disable-next-line react/require-default-props
    updateCallback?: () => void,
}

export default function LinkListRow(props: LinkRowProps) {
    const { state } = useContext(UserContext);
    const { isOpen, onClose, onOpen } = useAppDisclosure();

    return (
        <Box>
            <Group ml={10} gap="6">
                <Button
                    background="orange.300"
                    color="white"
                    style={{ visibility: state.user?.memberType === 'Admin' ? 'visible' : 'hidden' }}
                    onClick={
                        async () => {
                            onOpen();
                        }
                    }
                >
                    Edit Link
                </Button>
                <Button
                    aria-label="Remove"
                    background="red"
                    color="white"
                    onClick={
                        async () => {
                            await deleteLink(state.token, props.data.linkId || 0);
                            if (props.updateCallback) {
                                await props.updateCallback();
                            }
                        }
                    }
                >
                    Delete
                    <BsTrash2 />
                </Button>
            </Group>
            <LinkModal
                link={props.data}
                editMode
                isOpen={isOpen}
                onClose={
                    async () => {
                        if (props.updateCallback) {
                            props.updateCallback();
                            onClose();
                        }
                    }
                }
            />
        </Box>
    );
}
