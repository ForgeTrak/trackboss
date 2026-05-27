import React, { useState } from 'react';
import {
    Accordion,
    Button,
    Checkbox,
    CheckboxGroup,
    Grid,
    GridItem,
    Heading,
    Input,
    NativeSelect,
    Text,
    Separator,
} from '@chakra-ui/react';
import ReactQuill from 'react-quill';
import AppModal, { AppModalBody, AppModalFooter } from '../AppModal';
import 'react-quill/dist/quill.snow.css';
import { useAppToast } from '../../hooks/useAppToast';

import { MembershipTag } from '../../../../src/typedefs/membershipTag';
import { createCommunication } from '../../controller/communication';
import { MemberCommunication } from '../../../../src/typedefs/memberCommunication';

interface CreateCommunicationModalProps {
    isOpen: boolean,
    token: string,
    userId: number,
    onClose: () => void,
    tags?: MembershipTag[],
    addAction: () => void,
}

export default function CreateCommunicationModal(props: CreateCommunicationModalProps) {
    // internal state management for the UI.
    const [characterLimit, setCharacterLimit] = useState<number>(40000);
    const [characterCount, setCharacterCount] = useState<number>(0);

    const [totalCount, setTotalCount] = useState<number>(0);

    // Data that gets pushed across the wire.
    const [subject, setSubject] = useState<string>('');
    const [mechanism, setMechanism] = useState<string>('EMAIL');
    const [messageText, setMessageText] = useState<string>('');
    const [selectedTags, setSelectedTags] = useState<any>([]);

    const { tags, token, userId } = props;

    const tagCheckBoxes = tags?.map((tag) => {
        const tagCheckBox = (
            <Checkbox.Root
                colorPalette="orange"
                key={tag.id}
                onCheckedChange={
                    (e) => {
                        // tie the tag count to the checkbox, then subtract it if the box is unchecked.
                        // this allows updating the count in the UI in a fancy way.
                        let tagCount = tag.count || 0;
                        if (!e.checked) {
                            tagCount *= -1;
                            delete selectedTags[tag.value];
                            setSelectedTags(selectedTags);
                        } else {
                            selectedTags[tag.value] = tag;
                            setSelectedTags(selectedTags);
                        }
                        setTotalCount(totalCount + tagCount);
                    }
                }
            >
                <Checkbox.HiddenInput />
                <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                <Checkbox.Label>
                    <Text fontSize="sm">{tag.value}</Text>
                </Checkbox.Label>
            </Checkbox.Root>
        );
        return tagCheckBox;
    });

    const resetPopupState = () => {
        setCharacterCount(0);
        setSelectedTags([]);
        setTotalCount(0);
        setMechanism('EMAIL');
        setSubject('');
    };

    const toast = useAppToast();

    return (
        <AppModal size="xl" isOpen={props.isOpen} onClose={props.onClose}>
            <Heading
                textAlign="center"
            >
                Communication to membership
            </Heading>
            <Separator />
            <AppModalBody>
                <Grid columnGap={2} rowGap={2}>
                    <GridItem colSpan={2}>
                        <Text>Subject</Text>
                        <Input
                            size="md"
                            onChange={
                                (e) => {
                                    setSubject(e.target.value);
                                }
                            }
                        />
                    </GridItem>
                    <GridItem colSpan={2}>
                        <Text>Communication Type</Text>
                        <NativeSelect.Root>
                            <NativeSelect.Field
                                colorPalette="orange"
                                onChange={
                                    (e) => {
                                        const selectedType = e.target.value;
                                        if (selectedType === 'TEXT') {
                                            setCharacterLimit(140);
                                        } else {
                                            setCharacterLimit(40000);
                                        }
                                        setMechanism(selectedType);
                                    }
                                }
                            >
                                <option value="EMAIL">Email</option>
                                <option value="TEXT">Text (limited to 140 characters)</option>
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                        </NativeSelect.Root>
                    </GridItem>
                    <GridItem colSpan={2}>
                        <Accordion.Root collapsible>
                            <Accordion.Item value="item-0">
                                <Accordion.ItemTrigger>
                                    <Accordion.ItemIndicator />
                                    <Text fontSize="sm">
                                        Audience Tags (choose zero to many).
                                        Choose no tags to send to all members.
                                    </Text>
                                </Accordion.ItemTrigger>
                                <Accordion.ItemContent>
                                    <Accordion.ItemBody>
                                        <Text fontSize="xs">
                                            {`${totalCount} ${mechanism.toLowerCase()}(s) with selected tag(s).  `}
                                            Note multiple members can have the same tag.  Duplicates will be filtered on
                                            send, and each member will only get a notification one time.  These only go
                                            to membership admins (primary person on the membership).
                                        </Text>
                                        <Grid templateColumns="repeat(3, 1fr)" gap={1}>
                                            <CheckboxGroup>
                                                {tagCheckBoxes}
                                            </CheckboxGroup>
                                        </Grid>
                                    </Accordion.ItemBody>
                                </Accordion.ItemContent>
                            </Accordion.Item>
                        </Accordion.Root>
                    </GridItem>
                    <GridItem colSpan={2}>
                        <Text>Communication Content (note text does not support formatting)</Text>
                        <ReactQuill
                            theme="snow" // You can also use 'bubble' or customize themes
                            style={{ height: 350 }}
                            placeholder="Compose your email..."
                            onChange={
                                (content) => {
                                    if (content.length > characterLimit) {
                                        // eslint-disable-next-line no-param-reassign
                                        content = content.substring(0, characterLimit);
                                    }
                                    setMessageText(content);
                                    setCharacterCount(content.length);
                                }
                            }
                        />
                        <Text fontSize="xs">
                            {`${characterCount} / ${characterLimit} character limit`}
                        </Text>
                    </GridItem>
                </Grid>
            </AppModalBody>
            <AppModalFooter>
                <Button
                    variant="ghost"
                    mr={3}
                    size="lg"
                    onClick={
                        () => {
                            resetPopupState();
                            props.onClose();
                        }
                    }
                >
                    Cancel
                </Button>
                <Button
                    backgroundColor="orange"
                    color="white"
                    size="lg"
                    onClick={
                        async () => {
                            const communication : MemberCommunication = {
                                subject,
                                mechanism,
                                text: messageText,
                                senderId: userId,
                                selectedTags: Object.keys(selectedTags),
                            };
                            await createCommunication(token, communication);
                            resetPopupState();
                            props.addAction();
                            toast.success({
                                title: 'Member communication queued for sending.',
                                description: `Subject: ${communication.subject} via ${communication.mechanism}`,
                            });
                            props.onClose();
                        }
                    }
                >
                    Send
                </Button>
            </AppModalFooter>
        </AppModal>
    );
}
CreateCommunicationModal.defaultProps = {
    tags: [],
};
