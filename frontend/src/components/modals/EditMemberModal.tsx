/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
import React, { useContext, useEffect, useState } from 'react';
import { Button, Grid, GridItem, Input, Text } from '@chakra-ui/react';
import isEmail from 'validator/es/lib/isEmail';
import isMobilePhone from 'validator/es/lib/isMobilePhone';
import DatePicker from 'react-date-picker';
import moment from 'moment';
import Select from 'react-select';
import AppModal, { AppModalBody, AppModalCloseButton, AppModalFooter, AppModalHeader } from '../AppModal';
import { useAppToast } from '../../hooks/useAppToast';
import { useAppDisclosure } from '../../hooks/useAppDisclosure';
import { UserContext } from '../../contexts/UserContext';

import { Member, PatchMemberRequest } from '../../../../src/typedefs/member';
import { PatchMembershipRequest } from '../../../../src/typedefs/membership';

import { updateMember } from '../../controller/member';
import { updateMembership } from '../../controller/membership';

import MembershipTypeSelector from '../shared/MembershipTypeSelector';
import WrappedSwitchInput from '../input/WrappedSwitchInput';

interface EditMemberModalProps {
    member: Member,
    refreshMemberFunction: () => void,
    isFamilyMember?: boolean,
    hasEmail?: boolean,
}

export default function EditMemberModal(props: EditMemberModalProps) {
    const selectedMember = props.member;
    const {
        isOpen,
        onOpen,
        onClose,
    } = useAppDisclosure();
    const toast = useAppToast();
    const [streetAddress, setStreetAddress] = useState<string>(selectedMember.address);
    const [city, setCity] = useState<string>(selectedMember.city);
    const [memberAddressState, setMemberAddressState] = useState<string>(selectedMember.state);
    const [zip, setZip] = useState<string>(selectedMember.zip);
    const [phoneNumber, setPhoneNumber] = useState<string>(selectedMember.phoneNumber || '');
    const [email, setEmail] = useState<string>(selectedMember.email || '');
    const [dirty, setDirty] = useState<boolean>(false);
    const [emailValid, setEmailValid] = useState<boolean>(isEmail(email));
    const [birthdate, setBirthDate] = useState<Date>();
    const [membershipType, setMembershipType] = useState<number>(selectedMember.membershipTypeId);
    const [firstName, setFirstName] = useState<string>(selectedMember.firstName);
    const [lastName, setLastName] = useState<string>(selectedMember.lastName);
    const [subscribed, setSubscribed] = useState<boolean>(selectedMember.subscribed || false);
    const [dependentStatus, setDependentStatus] = useState<string>(selectedMember.dependentStatus || '');
    // eslint-disable-next-line max-len
    const [isEligibleDependent, setIsEligibleDependent] = useState<boolean>(selectedMember.isEligibleDependent || false);
    const [rowCount] = useState<number>(7);

    const { state } = useContext(UserContext);

    useEffect(() => {
        setFirstName(selectedMember.firstName);
        setLastName(selectedMember.lastName);
        setStreetAddress(selectedMember.address);
        setCity(selectedMember.city);
        setMemberAddressState(selectedMember.state);
        setEmail(selectedMember.email);
        setPhoneNumber(selectedMember.phoneNumber || '');
        setBirthDate(moment(selectedMember.birthdate).toDate());
    }, [selectedMember]);

    return (
        <>
            <Button
                textDecoration="underline"
                color="orange"
                variant="ghost"
                disabled={!selectedMember.active}
                onClick={onOpen}
            >
                Edit
            </Button>
            <AppModal isOpen={isOpen} onClose={onClose}>
                <AppModalCloseButton />
                <AppModalHeader>
                    {`Edit member info - ${selectedMember.firstName} ${props.member.lastName}`}
                </AppModalHeader>
                <AppModalBody>
                    <Grid
                        templateRows={`repeat(${rowCount}, 1fr)`}
                        templateColumns="repeat(2, 1fr)"
                        columnGap={1}
                        rowGap={1}
                    >
                        <GridItem colSpan={1}>
                            <Text>First Name</Text>
                            <Input
                                value={firstName}
                                size="md"
                                onChange={
                                    (e) => {
                                        setDirty(true);
                                        setFirstName(e.target.value);
                                    }
                                }
                            />
                        </GridItem>
                        <GridItem colSpan={1}>
                            <Text>Last Name</Text>
                            <Input
                                value={lastName}
                                size="md"
                                onChange={
                                    (e) => {
                                        setDirty(true);
                                        setLastName(e.target.value);
                                    }
                                }
                            />
                        </GridItem>
                        <GridItem colSpan={2} display={!props.isFamilyMember ? 'block' : 'none'}>
                            <Text>Membership Type</Text>
                            <MembershipTypeSelector
                                isAdmin={state.user?.memberType === 'Admin'}
                                currentType={selectedMember.membershipType}
                                setSelectedOption={
                                    (mt: number) => {
                                        setMembershipType(mt);
                                        setDirty(true);
                                    }
                                }
                            />
                        </GridItem>
                        <GridItem colSpan={1}>
                            <Text>DOB</Text>
                            <DatePicker
                                onChange={
                                    (date:any) => {
                                        setBirthDate(date);
                                        setDirty(true);
                                    }
                                }
                                value={birthdate instanceof Date && !Number.isNaN(birthdate.getTime()) ? birthdate : null}
                                required
                                maxDate={new Date()}
                            />
                        </GridItem>
                        <GridItem colSpan={2} display={!props.isFamilyMember ? 'block' : 'none'}>
                            <Text>Street Address</Text>
                            <Input
                                value={streetAddress}
                                size="md"
                                onChange={
                                    (e) => {
                                        setDirty(true);
                                        setStreetAddress(e.target.value);
                                    }
                                }
                            />
                        </GridItem>
                        <GridItem colSpan={1} display={!props.isFamilyMember ? 'block' : 'none'}>
                            <Text>City</Text>
                            <Input
                                value={city}
                                size="md"
                                onChange={
                                    (e) => {
                                        setDirty(true);
                                        setCity(e.target.value);
                                    }
                                }
                            />
                        </GridItem>
                        <GridItem display={!props.isFamilyMember ? 'block' : 'none'}>
                            <Text>State</Text>
                            <Input
                                value={memberAddressState}
                                size="md"
                                onChange={
                                    (e) => {
                                        setDirty(true);
                                        setMemberAddressState(e.target.value);
                                    }
                                }
                            />
                        </GridItem>
                        <GridItem display={!props.isFamilyMember ? 'block' : 'none'}>
                            <Text>Zip</Text>
                            <Input
                                value={zip}
                                size="md"
                                width="auto"
                                onChange={
                                    (e) => {
                                        setDirty(true);
                                        setZip(e.target.value);
                                    }
                                }
                            />
                        </GridItem>
                        <GridItem colSpan={2} display={props.hasEmail ? 'block' : 'none'}>
                            <Text>email (Changing this changes the login email too)</Text>
                            <Text color="red" fontSize="xs" hidden={emailValid}>
                                email must be a valid email address
                            </Text>
                            <Input
                                size="md"
                                value={email}
                                onChange={
                                    (e) => {
                                        const typedEmail = e.target.value;
                                        setEmailValid(isEmail(typedEmail));
                                        setEmail(typedEmail);
                                        setDirty(emailValid);
                                    }
                                }
                            />
                        </GridItem>
                        <GridItem colSpan={2}>
                            <Text>Phone</Text>
                            <Input
                                value={phoneNumber}
                                size="md"
                                minLength={12}
                                maxLength={12}
                                pattern="^\+1\d{10}$"
                                onChange={
                                    (e) => {
                                        setDirty(true);
                                        const typedPhoneNumber = e.target.value;
                                        if (typedPhoneNumber) {
                                            if (!typedPhoneNumber.startsWith('+1')) {
                                                setPhoneNumber(`+1${typedPhoneNumber}`);
                                            } else {
                                                setPhoneNumber(typedPhoneNumber);
                                            }
                                        }
                                    }
                                }
                            />
                        </GridItem>
                        <GridItem colSpan={2}>
                            <Text>Dependent Status</Text>
                            <Select
                                isDisabled={selectedMember.memberType.toLowerCase() === 'membership admin'}
                                placeholder={selectedMember.dependentStatus}
                                options={
                                    [
                                        { value: 'Primary', label: 'Primary member' },
                                        { value: 'Spouse/Partner', label: 'Spouse/Partner' },
                                        { value: 'Child', label: 'Child' },
                                        { value: 'Disabled Adult', label: 'Disabled Adult' },
                                    ]
                                }
                                onChange={
                                    (e) => {
                                        setDependentStatus(e?.value || '');
                                        setDirty(true);
                                    }
                                }
                            />
                            <WrappedSwitchInput
                                defaultChecked={isEligibleDependent}
                                locked={(selectedMember?.dependentStatus !== 'Child')}
                                maxWidth={200}
                                wrapperText="Eligible Dependent?"
                                onSwitchChange={
                                    () => {
                                        setIsEligibleDependent(!isEligibleDependent);
                                        setDirty(true);
                                    }
                                }
                            />
                        </GridItem>
                        <GridItem colSpan={2} display={props.hasEmail ? 'block' : 'none'}>
                            <WrappedSwitchInput
                                wrapperText="Subscribed to communications"
                                defaultChecked={subscribed}
                                maxWidth={200}
                                onSwitchChange={
                                    () => {
                                        setSubscribed(!subscribed);
                                        setDirty(true);
                                    }
                                }
                            />
                        </GridItem>
                    </Grid>
                </AppModalBody>
                <AppModalFooter>
                    <Button
                        mr={4}
                        backgroundColor="orange"
                        disabled={!dirty}
                        color="white"
                        onClick={
                            async () => {
                                selectedMember.address = streetAddress;
                                selectedMember.city = city;
                                selectedMember.state = memberAddressState;
                                selectedMember.zip = zip;
                                selectedMember.email = email;
                                selectedMember.phoneNumber = phoneNumber;
                                if (!phoneNumber.startsWith('+1')) {
                                    setPhoneNumber(`+1${phoneNumber}`);
                                }
                                const memberUpdate : PatchMemberRequest = {
                                    firstName,
                                    lastName,
                                    email,
                                    phoneNumber,
                                    birthdate: moment(birthdate).format('YYYY-MM-DD'),
                                    modifiedBy: state.user?.memberId || 0,
                                    subscribed,
                                    dependentStatus,
                                    isEligibleDependent,
                                };
                                await updateMember(state.token, selectedMember.memberId, memberUpdate);
                                if (!props.isFamilyMember) {
                                    const membershipUpdate: PatchMembershipRequest = {
                                        membershipTypeId: membershipType,
                                        address: streetAddress,
                                        city,
                                        state: memberAddressState,
                                        zip,
                                        modifiedBy: state.user?.memberId || 0,
                                    };
                                        // eslint-disable-next-line max-len
                                    await updateMembership(state.token, selectedMember.membershipId, membershipUpdate);
                                }
                                props.refreshMemberFunction();
                                toast.success({
                                    title: 'Member info updated',
                                    description: `${JSON.stringify(selectedMember)}`,
                                });
                                onClose();
                            }
                        }
                    >
                        Save
                    </Button>
                    <Button backgroundColor="white" onClick={onClose}>
                        Close
                    </Button>
                </AppModalFooter>
            </AppModal>
        </>
    );
}
EditMemberModal.defaultProps = {
    isFamilyMember: false,
    hasEmail: true,
};
