/* eslint-disable max-len */
import React, { useState } from 'react';
import {
    Alert,
    Button,
    Grid,
    GridItem,
    Heading,
    Link,
    SimpleGrid,
    Tabs,
    Text,
    Textarea,
    VStack,
    Separator,
    List,
} from '@chakra-ui/react';
import moment from 'moment';
import AppModal, { AppModalFooter } from '../AppModal';
import { MembershipApplication } from '../../../../src/typedefs/membershipApplication';
import NameAddressDisplay from '../shared/NameAddressDisplay';
import { acceptMembershipApplication, rejectMembershipApplication, reviewMembershipApplication } from '../../controller/membershipApplication';

interface appModalProps {
    // your data goes here.
    membershipApplication: MembershipApplication,
    isOpen: boolean,
    // typically the useAppDisclosure passed from the parent.
    onClose: () => void,
    // callback function for throwing data back to the parent.
    addAction: () => void,
    token: string,
}

export default function MembershipApplicationModal(props: appModalProps) {
    const { membershipApplication, isOpen, onClose } = props;

    const [applicantNotes, setApplicantNotes] = useState<string>(membershipApplication.sharedNotes || '');
    const [internalNotes, setInternalNotes] = useState<string>(membershipApplication.internalNotes || '');
    const reviewOrRejected = ((membershipApplication.status === 'Review') ||
        (membershipApplication.status === 'Rejected'));
    const isAccepted = (membershipApplication.status === 'Accepted');

    return (
        <AppModal size="lg" isOpen={isOpen} onClose={onClose} contentProps={{ m: 3 }}>
            <Heading ml={3}>
                Application -
                &nbsp;
                {membershipApplication.firstName}
                    &nbsp;
                {membershipApplication.lastName}
            </Heading>
            <Separator />
            <SimpleGrid columns={[1, 1, 1]} gap={0.5} m={3}>
                <Tabs.Root variant="subtle" bg="white" colorPalette="orange" defaultValue="info">
                    <Tabs.List fontSize="md" flexWrap="wrap" overflow="visible">
                        <Tabs.Trigger rounded="md" value="info" whiteSpace="nowrap">Application Info</Tabs.Trigger>
                        <Tabs.Trigger rounded="md" value="family" whiteSpace="nowrap">Family Members</Tabs.Trigger>
                        <Tabs.Trigger rounded="md" value="notes" whiteSpace="nowrap">Notes</Tabs.Trigger>
                    </Tabs.List>
                    <Tabs.Content value="info">
                        <NameAddressDisplay
                            addressContainer={membershipApplication}
                        />
                        <Text fontSize="md">
                            {membershipApplication.occupation}
                        </Text>
                        <Text fontSize="md">
                            Recommended by
                            &nbsp;
                            {membershipApplication.referredBy}
                        </Text>
                        <Text fontSize="lg">
                            Application ID:
                            &nbsp;
                            {membershipApplication.id}
                        </Text>
                        <Text fontSize="lg">
                            Application received at
                            &nbsp;
                            {membershipApplication.receivedDate.toString()}
                        </Text>
                        <Link
                            href={membershipApplication.googleLink}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Link to Google results for
                            &nbsp;
                            {membershipApplication.firstName}
                        </Link>
                    </Tabs.Content>
                    <Tabs.Content value="family">
                        <List.Root as="ol">
                            {
                                membershipApplication.familyMembers && (membershipApplication.familyMembers.map((familyMember: any) => (
                                    <List.Item>
                                        {familyMember.firstName}
                                            &nbsp;
                                        {familyMember.lastName}
                                            &nbsp;
                                        {`(${moment(new Date()).diff(familyMember.dob, 'years')})`}
                                    </List.Item>
                                )))
                            }
                        </List.Root>
                    </Tabs.Content>
                    <Tabs.Content value="notes">
                        <VStack gap={2}>
                            <Text>Notes to applicant (emailed to applicant)</Text>
                            <Textarea
                                placeholder="Notes to applicant (sent in email)"
                                onChange={
                                    (e) => {
                                        setApplicantNotes(e.target.value);
                                    }
                                }
                                defaultValue={applicantNotes}
                            />
                            <Text>Internal Notes (not shared)</Text>
                            <Textarea
                                placeholder="Internal notes (not shared)"
                                onChange={
                                    (e) => {
                                        setInternalNotes(e.target.value);
                                    }
                                }
                                defaultValue={internalNotes}
                            />
                        </VStack>
                    </Tabs.Content>
                </Tabs.Root>
                <Alert.Root status="warning">
                    <Alert.Indicator />
                    Clicking the Accept or Reject buttons sends emails to the applicant, and also finalizes their
                    application status.
                </Alert.Root>
            </SimpleGrid>
            <AppModalFooter>
                <Grid templateColumns="repeat(2, 2fr)" gap={3}>
                    <GridItem>
                        <Button
                            variant="ghost"
                            mr={3}
                            size="lg"
                            onClick={
                                () => {
                                    props.onClose();
                                }
                            }
                        >
                            Close
                        </Button>
                    </GridItem>
                    <GridItem>
                        <Button
                            backgroundColor="orange.300"
                            color="white"
                            variant="ghost"
                            size="lg"
                            disabled={!reviewOrRejected}
                            onClick={
                                async () => {
                                    await reviewMembershipApplication(props.token, membershipApplication.id, internalNotes, applicantNotes);
                                    props.addAction();
                                    onClose();
                                }
                            }
                        >
                            Review
                        </Button>
                    </GridItem>
                    <GridItem>
                        <Button
                            color="red"
                            variant="ghost"
                            size="lg"
                            disabled={!reviewOrRejected}
                            onClick={
                                async () => {
                                    await rejectMembershipApplication(props.token, membershipApplication.id, internalNotes, applicantNotes);
                                    props.addAction();
                                    onClose();
                                }
                            }
                        >
                            Reject
                        </Button>
                    </GridItem>
                    <GridItem>
                        <Button
                            color="green"
                            variant="ghost"
                            size="lg"
                            disabled={isAccepted}
                            onClick={
                                async () => {
                                    await acceptMembershipApplication(props.token, membershipApplication.id, internalNotes, applicantNotes);
                                    props.addAction();
                                    onClose();
                                }
                            }
                        >
                            Accept
                        </Button>
                    </GridItem>
                    <GridItem>
                        <Button
                            color="green"
                            size="lg"
                            variant="ghost"
                            disabled={!reviewOrRejected}
                            onClick={
                                async () => {
                                    await acceptMembershipApplication(props.token, membershipApplication.id, internalNotes, applicantNotes, true);
                                    props.addAction();
                                    onClose();
                                }
                            }
                        >
                            Accept as Guest
                        </Button>
                    </GridItem>
                </Grid>
            </AppModalFooter>
        </AppModal>
    );
}
