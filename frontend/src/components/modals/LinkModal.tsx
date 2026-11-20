import React, { useState, useContext } from 'react';
import {
    Button,
    Grid,
    GridItem,
    Heading,
    Input,
    Separator,
    Text,
} from '@chakra-ui/react';
import isURL from 'validator/es/lib/isURL';
import AppModal, { AppModalBody, AppModalFooter } from '../AppModal';
import { useAppToast } from '../../hooks/useAppToast';
import { Link } from '../../../../src/typedefs/link';
import { createLink, updateLink } from '../../controller/links';
import { UserContext } from '../../contexts/UserContext';
import WrappedSwitchInput from '../input/WrappedSwitchInput';

interface LinkModalProps {
    link?: Link,
    isOpen: boolean,
    onClose: () => void,
    editMode: boolean,
}

const isValidExternalUrl = (value?: string) => Boolean(value && isURL(value, {
    protocols: ['http', 'https'],
    require_protocol: true,
}));

export default function LinkModal(props: LinkModalProps) {
    const { link, editMode } = props;
    const [linkTitle, setLinkTitle] = useState<string>();
    const [linkUrl, setLinkUrl] = useState<string>();
    const [urlValid, setUrlValid] = useState<boolean>(
        link?.linkUrl ? isValidExternalUrl(link.linkUrl) : true,
    );
    const [online, setOnline] = useState<boolean>();

    const toast = useAppToast();
    const { state } = useContext(UserContext);

    const effectiveTitle = linkTitle ?? link?.linkTitle ?? '';
    const effectiveUrl = linkUrl ?? link?.linkUrl ?? '';
    const canSubmit = effectiveTitle.trim().length > 0 && isValidExternalUrl(effectiveUrl);

    return (
        <AppModal size="xl" isOpen={props.isOpen} onClose={props.onClose}>
            <Heading textAlign="center">
                { editMode ? 'Update Link' : 'Create Link' }
            </Heading>
            <Separator />
            <AppModalBody>
                <Grid
                    templateRows="repeat(3, 1fr)"
                    templateColumns="repeat(2, 1fr)"
                    columnGap={3}
                    rowGap={3}
                >
                    <GridItem colSpan={2}>
                        <Text>Title</Text>
                        <Input
                            defaultValue={link?.linkTitle}
                            size="md"
                            onChange={
                                (e) => {
                                    setLinkTitle(e.target.value);
                                }
                            }
                        />
                    </GridItem>
                    <GridItem colSpan={2}>
                        <Text>URL</Text>
                        <Text color="red" fontSize="xs" hidden={urlValid}>
                            URL must be a valid external address (e.g. https://example.com)
                        </Text>
                        <Input
                            defaultValue={link?.linkUrl}
                            placeholder="https://example.com"
                            size="md"
                            onChange={
                                (e) => {
                                    const typedUrl = e.target.value;
                                    setLinkUrl(typedUrl);
                                    setUrlValid(isValidExternalUrl(typedUrl));
                                }
                            }
                        />
                    </GridItem>
                    <GridItem colSpan={1}>
                        <WrappedSwitchInput
                            wrapperText="Online"
                            defaultChecked={link?.online ?? true}
                            maxWidth={150}
                            onSwitchChange={
                                (value) => {
                                    setOnline(value);
                                }
                            }
                        />
                    </GridItem>
                </Grid>
            </AppModalBody>
            <AppModalFooter>
                <Button
                    backgroundColor="orange"
                    color="white"
                    disabled={!canSubmit}
                    onClick={
                        async () => {
                            const linkEntry: Link = {
                                linkTitle: effectiveTitle,
                                linkUrl: effectiveUrl,
                                online: online ?? link?.online ?? true,
                            };
                            if (editMode) {
                                linkEntry.linkId = link?.linkId || 0;
                                linkEntry.linkDisplayOrder = link?.linkDisplayOrder;
                                await updateLink(state.token, linkEntry);
                            } else {
                                await createLink(state.token, linkEntry);
                            }
                            toast.success({
                                title: 'Link info updated',
                                description: `${JSON.stringify(linkEntry)}`,
                                duration: 2500,
                            });
                            props.onClose();
                        }
                    }
                >
                    { editMode ? 'Update' : 'Save' }
                </Button>
                <Button
                    backgroundColor="white"
                    onClick={props.onClose}
                >
                    Close
                </Button>
            </AppModalFooter>
        </AppModal>
    );
}
LinkModal.defaultProps = {
    link: undefined,
};
