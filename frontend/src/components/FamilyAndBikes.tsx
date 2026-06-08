import React, { useContext, useEffect, useState } from 'react';
import { Heading, VStack, HStack, SimpleGrid, Button, List } from '@chakra-ui/react';
import moment from 'moment';
import _ from 'lodash';
import { useAppDisclosure } from '../hooks/useAppDisclosure';
import { GetMemberListResponse, Member } from '../../../src/typedefs/member';
import { Bike, GetBikeListResponse } from '../../../src/typedefs/bike';
import DeleteAlert from './modals/DeleteAlert';
import AddFamilyModal from './modals/AddFamilyModal';
import BikeModal from './modals/BikeModal';
import { getFamilyMembers, updateMember } from '../controller/member';
import { UserContext } from '../contexts/UserContext';
import { createBike, deleteBike, getBikeList, updateBike } from '../controller/bike';
import EditMemberModal from './modals/EditMemberModal';

interface cardProps {
    admin: boolean
}

export default function GeneralInfo(props: cardProps) {
    const { state } = useContext(UserContext);
    const { onClose: onRemoveFamilyClose, isOpen: isRemoveFamilyOpen, onOpen: onRemoveFamilyOpen } = useAppDisclosure();
    const { onClose: onAddFamilyClose, isOpen: isAddFamilyOpen, onOpen: onAddFamilyOpen } = useAppDisclosure();

    const { onClose: onRemoveBikeClose, isOpen: isRemoveBikeOpen, onOpen: onRemoveBikeOpen } = useAppDisclosure();
    const { onClose: onEditBikeClose, isOpen: isEditBikeOpen, onOpen: onEditBikeOpen } = useAppDisclosure();
    const { onClose: onAddBikeClose, isOpen: isAddBikeOpen, onOpen: onAddBikeOpen } = useAppDisclosure();

    const [memberFamily, setMemberFamily] = useState<GetMemberListResponse>([]);
    const [memberBikes, setMemberBikes] = useState<GetBikeListResponse>([]);

    const [memberToRemove, setMemberToRemove] = useState<Member>();
    const [bikeToRemove, setBikeToRemove] = useState<Bike>();
    const [bikeToEdit, setBikeToEdit] = useState<Bike>();

    async function refreshBikeList() {
        const newBikeList = await getBikeList(state.token, state?.user?.membershipId);
        setMemberBikes(newBikeList);
    }

    async function refreshFamilyList() {
        const membershipId = state.user?.membershipId || 0;
        let family = await getFamilyMembers(state.token, membershipId);
        family = (family as Member[]).filter((m) => m.active);
        setMemberFamily(family);
    }

    async function removeFamilyMember() {
        if (memberToRemove !== undefined && state.user !== undefined) {
            await updateMember(
                state.token,
                memberToRemove.memberId,
                { active: false, modifiedBy: state.user.memberId, subscribed: false },
            );
        }
        await refreshFamilyList();
    }

    async function removeBike() {
        if (bikeToRemove !== undefined && state.user !== undefined) {
            await deleteBike(state.token, bikeToRemove.bikeId);
        }
        await refreshBikeList();
    }

    async function editBike(editedBike: Bike, bikeYear: string, bikeMake: string, bikeModel: string) {
        await updateBike(
            state.token,
            editedBike.bikeId,
            { year: bikeYear, make: bikeMake, model: bikeModel },
        );
        await refreshBikeList();
    }

    async function addBike(newYear: string, newMake: string, newModel: string) {
        if (state.user !== undefined) {
            await createBike(
                state.token,
                { year: newYear, make: newMake, model: newModel, membershipId: state.user.membershipId },
            );
        }
        await refreshBikeList();
    }

    useEffect(() => {
        refreshFamilyList();
        refreshBikeList();
    }, []);

    return (
        <SimpleGrid columns={1}>
            <VStack mt={25} borderRightWidth={0.5} borderRightColor="lightgrey">
                <HStack>
                    <Heading size="lg">Family</Heading>
                    {
                        props.admin && (
                            <Button
                                textDecoration="underline"
                                color="orange"
                                variant="ghost"
                                size="lg"
                                onClick={
                                    () => {
                                        onAddFamilyOpen();
                                    }
                                }
                            >
                                Add
                            </Button>
                        )
                    }
                </HStack>
                {
                    memberFamily && (
                        <List.Root as="ul" pt={10} gap={2}>
                            {
                                (memberFamily as Member[]).map((member) => (
                                    <HStack>
                                        <List.Item
                                            fontSize="xl"
                                        >
                                            {
                                                `${member.firstName} 
                                                ${member.lastName} (${member.dependentStatus})
                                                (Age: ${moment().diff(member.birthdate, 'years')})`
                                            }
                                        </List.Item>
                                        {
                                            (props.admin && (member.memberType === 'Member')) && (
                                                <>
                                                    <EditMemberModal
                                                        isFamilyMember
                                                        member={member}
                                                        hasEmail={!_.isEmpty(member.email)}
                                                        refreshMemberFunction={
                                                            async () => {
                                                                await refreshFamilyList();
                                                            }
                                                        }
                                                    />
                                                    <Button
                                                        textDecoration="underline"
                                                        color="red"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={
                                                            () => {
                                                                setMemberToRemove(member);
                                                                onRemoveFamilyOpen();
                                                            }
                                                        }
                                                    >
                                                        Remove
                                                    </Button>
                                                </>
                                            )
                                        }
                                    </HStack>
                                ))
                            }
                        </List.Root>
                    )
                }
            </VStack>
            <VStack mt={25}>
                <HStack>
                    <Heading size="lg">Bikes</Heading>
                    {
                        props.admin && (
                            <Button
                                textDecoration="underline"
                                color="orange"
                                variant="ghost"
                                size="lg"
                                onClick={
                                    () => {
                                        onAddBikeOpen();
                                    }
                                }
                            >
                                Add
                            </Button>
                        )
                    }
                </HStack>
                {
                    memberBikes && (
                        <List.Root as="ul" pt={10} gap={2}>
                            {
                                (memberBikes as Bike[]).map((bike) => (
                                    <HStack>
                                        <List.Item
                                            fontSize="xl"
                                        >
                                            {` ${bike.year} ${bike.make} ${bike.model}`}
                                        </List.Item>
                                        {
                                            props.admin && (
                                                <Button
                                                    textDecoration="underline"
                                                    color="orange"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={
                                                        () => {
                                                            setBikeToEdit(bike);
                                                            onEditBikeOpen();
                                                        }
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                            )
                                        }
                                        {
                                            props.admin && (
                                                <Button
                                                    textDecoration="underline"
                                                    color="red"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={
                                                        () => {
                                                            setBikeToRemove(bike);
                                                            onRemoveBikeOpen();
                                                        }
                                                    }
                                                >
                                                    Remove
                                                </Button>
                                            )
                                        }
                                    </HStack>
                                ))
                            }
                        </List.Root>
                    )
                }
            </VStack>
            {
                isRemoveFamilyOpen && (
                    <DeleteAlert
                        isOpen={isRemoveFamilyOpen}
                        onClose={onRemoveFamilyClose}
                        // eslint-disable-next-line react/jsx-no-bind
                        removeMethod={removeFamilyMember}
                    />
                )
            }
            {
                isRemoveBikeOpen && (
                    <DeleteAlert
                        isOpen={isRemoveBikeOpen}
                        onClose={onRemoveBikeClose}
                        // eslint-disable-next-line react/jsx-no-bind
                        removeMethod={removeBike}
                    />
                )
            }
            {
                isEditBikeOpen && bikeToEdit && (
                    <BikeModal
                        isOpen={isEditBikeOpen}
                        onClose={onEditBikeClose}
                        bikeToEdit={bikeToEdit}
                        // eslint-disable-next-line react/jsx-no-bind
                        onSave={
                            (year: string, make: string, model: string) => {
                                editBike(bikeToEdit, year, make, model);
                            }
                        }
                    />
                )
            }
            {
                isAddFamilyOpen && (
                    <AddFamilyModal
                        isOpen={isAddFamilyOpen}
                        onClose={onAddFamilyClose}
                        // eslint-disable-next-line react/jsx-no-bind
                        refreshList={refreshFamilyList}
                        membershipAdmin={state.user}
                        token={state.token}
                    />
                )
            }
            {
                isAddBikeOpen && (
                    <BikeModal
                        isOpen={isAddBikeOpen}
                        onClose={onAddBikeClose}
                        // eslint-disable-next-line react/jsx-no-bind
                        onSave={addBike}
                    />
                )
            }
        </SimpleGrid>
    );
}
