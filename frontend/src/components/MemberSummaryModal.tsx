/* eslint-disable max-len */
// this file goes very deep into the DOM tree and has very long lines as a result, although most of the lines are composed of spacing
// disabling max-len because there really isn't another super reasonable way to handle this
import _ from 'lodash';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Button,
    Text,
    SimpleGrid,
    Heading,
    VStack,
    Divider,
    Container,
    HStack,
    UnorderedList,
    ListItem,
    ButtonGroup,
    useToast,
    Switch,
    Tag,
    TagLabel,
    TagCloseButton,
    Input,
    Link,
} from '@chakra-ui/react';
import Select from 'react-select';
import { BsTags } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { Member } from '../../../src/typedefs/member';
import { Bike } from '../../../src/typedefs/bike';
import { getMember, getMembersByMembership, resetMemberPassword, updateMember } from '../controller/member';
import { getBikeList } from '../controller/bike';
import AddPointsModal from './AddPointsModal';
import EditMemberModal from './modals/EditMemberModal';
import { MembershipTag } from '../../../src/typedefs/membershipTag';
import { addMembershipTags, deleteMembershipTags, getMembershipTags } from '../controller/membershipTags';

interface modalProps {
    isOpen: boolean,
    onClose: () => void,
    memberInfo: Member,
}

export default function MemberSummaryModal(props: modalProps) {
    const toast = useToast();
    const navigate = useNavigate();
    const navigateToMyAccount = () => {
        const path = '/settings';
        navigate(path);
    };

    const { state, update } = useContext(UserContext);

    const [selectedMember, setSelectedMember] = useState<Member>();
    const [family, setFamily] = useState<Member[]>();
    const [bikes, setBikes] = useState<Bike[]>();
    const tagArray : MembershipTag[] = [];
    const [tags, setTags] = useState<MembershipTag[]>(tagArray);
    const [updater, setUpdater] = useState<Member>();
    const [newTagValue, setNewTagValue] = useState<string>();

    const [editingMemberRole, setEditingMemberRole] = useState<boolean>(false);
    const [editedMemberType, setEditedMemberType] = useState<string>('');
    const [deactivateEnabled, setDeactivateEnabled] = useState<boolean>(false);
    const [deactivationReason, setDeactivationReason] = useState<string>();

    const [error, setError] = useState<string>('');

    const deactivateMember = useCallback(async (reason:any) => {
        const response = await updateMember(
            state.token,
            props.memberInfo.memberId,
            { active: false, modifiedBy: state.user!.memberId, deactivationReason: reason, subscribed: false },
        );
        if ('reason' in response) {
            return false;
        }
        return true;
    }, [state, props.memberInfo]);

    const handlePatchMemberType = useCallback(async () => {
        let memberTypeId: number;
        if (editedMemberType === 'member') {
            memberTypeId = 9;
        } else if (editedMemberType === 'membership admin') {
            memberTypeId = 8;
        } else if (editedMemberType === 'admin') {
            memberTypeId = 7;
        } else {
            return false;
        }
        const updatedMember = await updateMember(
            state.token,
            props.memberInfo.memberId,
            { memberTypeId, modifiedBy: state.user!.memberId, subscribed: props.memberInfo.subscribed || false },
        );
        if ('reason' in updatedMember) {
            return false;
        }
        setSelectedMember(updatedMember);
        return true;
    }, [state, props.memberInfo, editedMemberType]);

    useEffect(() => {
        async function setModalData() {
            setSelectedMember(props.memberInfo);
            setEditedMemberType(props.memberInfo.memberType);
            let familyReponse = await getMembersByMembership(state.token, props.memberInfo.membershipId);
            familyReponse = familyReponse.filter((familyMember) => familyMember.active);
            setFamily(familyReponse);
            const bikeResponse = await getBikeList(state.token, props.memberInfo.membershipId);
            if ('reason' in bikeResponse) {
                setError(`error fetching bikes: ${bikeResponse.reason}`);
            } else {
                setBikes(bikeResponse);
            }
            const lastUpdater = await getMember(state.token, Number(props.memberInfo.lastModifiedBy));
            setUpdater(lastUpdater as Member);
        }
        setModalData();
    }, [props.memberInfo]);

    useEffect(() => {
        async function getMembershipTagsData() {
            const membershipTags = await getMembershipTags(state.token, props.memberInfo.membershipId);
            setTags(membershipTags);
        }
        getMembershipTagsData();
    }, [props.memberInfo, newTagValue]);
    const adminMode = (state.user?.memberType.toLowerCase() === 'admin');
    const viewingSelf = (state.user?.memberId === props.memberInfo.memberId);

    return (
        <Modal
            size="xl"
            isOpen={props.isOpen}
            onClose={props.onClose}
        >
            <ModalOverlay />
            <ModalContent pb={5}>
                <ModalHeader>
                    <Heading textAlign="center">Member Summary</Heading>
                </ModalHeader>
                <Divider />
                <ModalCloseButton />
                <ModalBody>
                    { error !== '' }
                    {
                        selectedMember && bikes && (
                            <SimpleGrid columns={[1, null, 2]} spacing={4}>
                                <VStack borderRightWidth={1} borderRightColor="light-grey" align="left">
                                    <HStack>
                                        <Text textAlign="left" fontSize="3xl" fontWeight="bold">Info</Text>
                                        {
                                            (adminMode || viewingSelf) && (
                                                <EditMemberModal
                                                    member={selectedMember}
                                                    refreshMemberFunction={
                                                        async () => {
                                                            const memberRefresh = await getMember(state.token, selectedMember.memberId);
                                                            setSelectedMember(memberRefresh as Member);
                                                        }
                                                    }
                                                />
                                            )
                                        }
                                    </HStack>
                                    <SimpleGrid pb={4} columns={2}>
                                        <VStack spacing={2} align="left">
                                            <Text fontSize="sm" fontWeight="bold">Name:</Text>
                                            <Text fontSize="sm" fontWeight="bold">Joined:</Text>
                                            <Text fontSize="sm" fontWeight="bold">Status:</Text>
                                            <Text fontSize="sm" fontWeight="bold">Email:</Text>
                                            <Text fontSize="sm" fontWeight="bold">Phone:</Text>
                                            {
                                                (adminMode || viewingSelf) && (
                                                    <>
                                                        <Text fontSize="sm" fontWeight="bold">DOB:</Text>
                                                        <Text fontSize="sm" fontWeight="bold">Address:</Text>
                                                    </>
                                                )
                                            }
                                        </VStack>

                                        <VStack ml="-70px" align="left">
                                            <Text fontSize="sm">
                                                {`${selectedMember.firstName} ${selectedMember.lastName}`}
                                            </Text>
                                            <Text fontSize="sm">
                                                {selectedMember.dateJoined.substring(0, 4)}
                                            </Text>
                                            <Text fontSize="sm">{selectedMember.membershipType}</Text>
                                            <Link
                                                href={`mailto:${selectedMember.email}`}
                                            >
                                                <Text fontSize="sm">{selectedMember.email}</Text>
                                            </Link>
                                            <Link
                                                href={`sms:${selectedMember.phoneNumber}`}
                                            >
                                                <Text fontSize="sm">{selectedMember.phoneNumber}</Text>
                                            </Link>
                                            {
                                                (adminMode || viewingSelf) && (
                                                    <>
                                                        <Text fontSize="sm">{selectedMember.birthdate}</Text>
                                                        <Text fontSize="sm">{selectedMember.address}</Text>
                                                        <Text fontSize="sm">
                                                            {`${selectedMember.city}, ${selectedMember.state} ${selectedMember.zip}`}
                                                        </Text>
                                                        <Text fontSize="xx-small">
                                                            {`Member #${selectedMember.memberId}, Membership #${selectedMember.membershipId}`}
                                                        </Text>
                                                        <Text fontSize="x-small">
                                                            {`Modified: ${selectedMember.lastModifiedDate}, by ${updater?.lastName}, ${updater?.firstName}`}
                                                        </Text>
                                                    </>
                                                )
                                            }
                                        </VStack>
                                    </SimpleGrid>
                                    <HStack>
                                        <Text textAlign="left" fontSize="3xl" fontWeight="bold">Family</Text>
                                    </HStack>
                                    <Text textAlign="left" fontSize="1xl" fontWeight="bold">Members</Text>
                                    <UnorderedList pl={10}>
                                        {
                                            family && _.map(family, (member) => (

                                                member.memberId === state.user!.memberId ? <ListItem key={member.memberId}>{`${member.firstName} ${member.lastName} - ${member.dependentStatus} (you)`}</ListItem>
                                                    : <ListItem key={member.memberId}>{`${member.firstName} ${member.lastName} - ${member.dependentStatus}`}</ListItem>
                                            ))
                                        }
                                    </UnorderedList>
                                    <Text textAlign="left" fontSize="1xl" fontWeight="bold">Bikes</Text>
                                    <UnorderedList pl={10}>
                                        {
                                            bikes.map((bike) => (
                                                <ListItem key={bike.bikeId}>{`${bike.year} ${bike.make} ${bike.model}`}</ListItem>
                                            ))
                                        }
                                    </UnorderedList>
                                </VStack>
                                <VStack align="left">
                                    <HStack>
                                        <Text
                                            textAlign="left"
                                            fontSize="3xl"
                                            fontWeight="bold"
                                        >
                                            Roles
                                        </Text>
                                        {
                                            (adminMode && selectedMember.active) && (
                                                <Button
                                                    textDecoration="underline"
                                                    color="orange"
                                                    variant="ghost"
                                                    onClick={
                                                        () => {
                                                            if (editingMemberRole) {
                                                                setEditingMemberRole(false);
                                                            } else {
                                                                setEditingMemberRole(true);
                                                            }
                                                        }
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                            )
                                        }
                                    </HStack>
                                    {
                                        editingMemberRole ? (
                                            <VStack align="left">
                                                <ButtonGroup size="sm" isAttached variant="outline">
                                                    <Button
                                                        onClick={
                                                            () => {
                                                                if (editedMemberType !== 'admin') {
                                                                    setEditedMemberType('admin');
                                                                }
                                                            }
                                                        }
                                                        mr="-px"
                                                        backgroundColor={(editingMemberRole && editedMemberType === 'admin') || (!editingMemberRole && props.memberInfo.memberType === 'Admin') ? 'blue' : ''}
                                                    >
                                                        PRA Admin
                                                    </Button>
                                                    <Button
                                                        onClick={
                                                            () => {
                                                                if (editedMemberType !== 'membership admin') {
                                                                    setEditedMemberType('membership admin');
                                                                }
                                                            }
                                                        }
                                                        mr="-px"
                                                        backgroundColor={(editingMemberRole && editedMemberType === 'membership admin') || (!editingMemberRole && props.memberInfo.memberType === 'Membership Admin') ? 'blue' : ''}
                                                    >
                                                        Membership Admin
                                                    </Button>
                                                </ButtonGroup>
                                                <Button
                                                    ml={10}
                                                    variant="outline"
                                                    size="xs"
                                                    color="green"
                                                    onClick={
                                                        async () => {
                                                            await handlePatchMemberType();
                                                            setEditingMemberRole(false);
                                                        }
                                                    }
                                                >
                                                    Save
                                                </Button>
                                            </VStack>
                                        ) : (
                                            <ButtonGroup size="sm" isAttached variant="outline">
                                                <Button
                                                    userSelect="none"
                                                    mr="-px"
                                                    backgroundColor={selectedMember.memberType.toLowerCase() === ('admin') ? 'blue' : ''}
                                                >
                                                    PRA Admin
                                                </Button>
                                                <Button
                                                    mr="-px"
                                                    backgroundColor={selectedMember.memberType.toLowerCase() === ('membership admin') ? 'blue' : ''}
                                                >
                                                    Membership Admin
                                                </Button>
                                            </ButtonGroup>
                                        )
                                    }
                                    <Container mb={20} />
                                    {
                                        adminMode && (
                                            <VStack align="left">
                                                <Text textAlign="left" fontSize="3xl" fontWeight="bold">Tags</Text>
                                                <HStack align="left">
                                                    <SimpleGrid columns={1} spacing={2}>
                                                        {
                                                            tags.map((tag) => (
                                                                <Tag key={tag.id} variant="subtle" colorScheme="orange">
                                                                    <TagLabel>{tag.value}</TagLabel>
                                                                    <TagCloseButton onClick={
                                                                        async () => {
                                                                            await deleteMembershipTags(state.token, props.memberInfo.membershipId, [tag.value]);
                                                                            setNewTagValue(tag.value);
                                                                        }
                                                                    }
                                                                    />
                                                                </Tag>
                                                            ))
                                                        }
                                                        <HStack>
                                                            <Input
                                                                size="xs"
                                                                id="newTag"
                                                                value={newTagValue}
                                                                onChange={
                                                                    (e) => {
                                                                        setNewTagValue(e.target.value);
                                                                    }
                                                                }
                                                            />
                                                            <Button
                                                                rightIcon={<BsTags />}
                                                                background="orange"
                                                                size="xs"
                                                                color="white"
                                                                onClick={
                                                                    async () => {
                                                                        if (newTagValue) {
                                                                            await addMembershipTags(state.token, props.memberInfo.membershipId, [newTagValue]);
                                                                            setNewTagValue('');
                                                                        }
                                                                    }
                                                                }
                                                            />
                                                        </HStack>
                                                    </SimpleGrid>
                                                </HStack>
                                                <Text textAlign="left" fontSize="3xl" fontWeight="bold">Actions</Text>
                                                <HStack align="left">
                                                    <AddPointsModal
                                                        memberName={`${selectedMember.firstName} ${selectedMember.lastName}` || ''}
                                                        memberId={selectedMember.memberId as number}
                                                        membershipId={selectedMember.membershipId}
                                                        visible={(selectedMember.active)}
                                                        token={state.token}
                                                        buttonText="Add points"
                                                        // do nothing if after adding points in this instance - we are on the member modal and there is nothing visible
                                                        // to refresh here.
                                                        refreshPoints={() => 0}
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        style={
                                                            {
                                                                whiteSpace: 'normal',
                                                                wordWrap: 'break-word',
                                                            }
                                                        }
                                                        onClick={
                                                            () => {
                                                                navigateToMyAccount();
                                                                // Sign in as the selected user (to sign them up for events), and store the original user as storedUser
                                                                update({ loggedIn: true, token: state.token, user: selectedMember, storedUser: state.user, isInitializing: false });
                                                            }
                                                        }
                                                    >
                                                        Act As Member
                                                    </Button>
                                                    <Button
                                                        isDisabled={!selectedMember.active}
                                                        variant="outline"
                                                        style={
                                                            {
                                                                whiteSpace: 'normal',
                                                                wordWrap: 'break-word',
                                                            }
                                                        }
                                                        onClick={
                                                            async () => {
                                                                const res = await resetMemberPassword(state.token, selectedMember.memberId);
                                                                toast({
                                                                    variant: 'subtle',
                                                                    title: `${selectedMember.email} set to "${res.value}"`,
                                                                    status: res ? 'success' : 'error',
                                                                    duration: 10000,
                                                                    isClosable: true,
                                                                });
                                                            }
                                                        }
                                                    >
                                                        Reset Password
                                                    </Button>
                                                </HStack>
                                                <HStack>
                                                    <VStack>
                                                        <Button
                                                            backgroundColor="red"
                                                            variant="outline"
                                                            isDisabled={!deactivateEnabled}
                                                            style={
                                                                {
                                                                    whiteSpace: 'normal',
                                                                    wordWrap: 'break-word',
                                                                }
                                                            }
                                                            onClick={
                                                                async () => {
                                                                    const res = await deactivateMember(deactivationReason);
                                                                    toast({
                                                                        variant: 'subtle',
                                                                        title: res ? 'Member Deactivated.' : 'Action Failed',
                                                                        status: res ? 'success' : 'error',
                                                                        duration: 3000,
                                                                        isClosable: true,
                                                                    });
                                                                }
                                                            }
                                                        >
                                                            De-Activate Member
                                                        </Button>
                                                    </VStack>
                                                    <Switch
                                                        colorScheme="orange"
                                                        visibility={selectedMember.active ? 'visible' : 'hidden'}
                                                        isChecked={deactivateEnabled}
                                                        onChange={
                                                            () => {
                                                                setDeactivateEnabled(!deactivateEnabled);
                                                            }
                                                        }
                                                    />
                                                </HStack>
                                                <HStack>
                                                    <Text fontSize="sm" fontWeight="bold">Reason:</Text>
                                                    <Select
                                                        isDisabled={!deactivateEnabled}
                                                        placeholder={selectedMember.deactivationReason || 'Choose a reason'}
                                                        getOptionLabel={(option) => option.label}
                                                        getOptionValue={(option) => option.value}
                                                        onChange={
                                                            async (e) => {
                                                                setDeactivationReason(e?.value);
                                                            }
                                                        }
                                                        options={
                                                            [
                                                                { value: 'Did not renew', label: 'Did not renew' },
                                                                { value: 'Did not pay', label: 'Did not pay' },
                                                                { value: 'Deceased', label: 'Deceased' },
                                                            ]
                                                        }
                                                        styles={
                                                            {
                                                                option: (provided, optionState) => ({
                                                                    ...provided,
                                                                    backgroundColor: optionState.isSelected ? '#ffa24d' : 'white',
                                                                    borderBottom: '1px solid #ffa24d',
                                                                }),
                                                            }
                                                        }
                                                    />
                                                </HStack>
                                                <Text size="sm">
                                                    Deactivating a member removes them from the list.  Use this feature carefully!
                                                </Text>
                                            </VStack>
                                        )
                                    }
                                </VStack>
                            </SimpleGrid>
                        )
                    }
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
