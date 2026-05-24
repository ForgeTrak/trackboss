import React, { useEffect, useState, useContext } from 'react';
import { Text, Heading, VStack, HStack, SimpleGrid, Separator } from '@chakra-ui/react';
import { Member } from '../../../src/typedefs/member';
import { getMember } from '../controller/member';
import { UserContext } from '../contexts/UserContext';
import EditMemberModal from './modals/EditMemberModal';

interface cardProps {
    user: Member,
}

export default function GeneralInfo(props: cardProps) {
    const { state } = useContext(UserContext);
    const [memberInfo, setMemberInfo] = useState<Member>();

    useEffect(() => {
        async function setMemberData() {
            setMemberInfo(props.user);
        }
        setMemberData();
    }, [props.user]);

    return (
        <VStack mt={25}>
            <HStack>
                <Heading>General Information</Heading>
                {
                    props.user.memberType.includes('Admin') && (
                        <EditMemberModal
                            member={props.user}
                            refreshMemberFunction={
                                async () => {
                                    const memberRefresh = await getMember(state.token, props.user.memberId);
                                    setMemberInfo(memberRefresh as Member);
                                }
                            }
                        />
                    )
                }
            </HStack>
            <Separator />
            {
                memberInfo && (
                    <SimpleGrid pt={10} columns={2}>
                        <VStack gap={2} align="left">
                            <Text fontSize="xl" fontWeight="bold">Name:</Text>
                            <Text fontSize="xl" fontWeight="bold">Address:</Text>
                            <Text fontSize="xl" fontWeight="bold">Email:</Text>
                            <Text fontSize="xl" fontWeight="bold">Phone:</Text>
                            <Text fontSize="xl" fontWeight="bold">Joined:</Text>
                            <Text fontSize="xl" fontWeight="bold">DOB:</Text>
                            <Text fontSize="xl" fontWeight="bold">Membership Admin:</Text>
                        </VStack>
                        <VStack align="left">
                            <Text fontSize="xl">
                                {`${memberInfo.firstName} ${memberInfo.lastName}`}
                            </Text>
                            <Text fontSize="xl">
                                {
                                    `${memberInfo.address} ${memberInfo.city},
                                            ${memberInfo.state} ${memberInfo.zip}`
                                }
                            </Text>
                            <Text fontSize="xl">{memberInfo.email}</Text>
                            <Text fontSize="xl">{memberInfo.phoneNumber}</Text>
                            <Text fontSize="xl">{memberInfo.dateJoined}</Text>
                            <Text fontSize="xl">{memberInfo.birthdate}</Text>
                            <Text fontSize="xl">{memberInfo.membershipAdmin}</Text>
                        </VStack>

                    </SimpleGrid>
                )
            }
        </VStack>
    );
}
