import React, { useState, useContext } from 'react';
import _ from 'lodash';

import {
    Button, Divider, Grid, GridItem, Heading, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalOverlay, Text,
} from '@chakra-ui/react';
import PhoneInput from 'react-phone-number-input/input';

import { useAppToast } from '../../hooks/useAppToast';
import { PaidLabor } from '../../../../src/typedefs/paidLabor';
import { createPaidLabor, updatePaidLabor } from '../../controller/paidLabor';

import { UserContext } from '../../contexts/UserContext';

interface PaidLaborModalProps {
    laborer?: PaidLabor,
    isOpen: boolean,
    onClose: () => void,
    editMode: boolean,
}

export default function PaidLaborModal(props: PaidLaborModalProps) {
    const [firstName, setFirstName] = useState<string>();
    const [lastName, setLastName] = useState<string>();
    const [businessName, setBusinessName] = useState<string>();
    const [phone, setPhone] = useState<string>();
    const [email, setEmail] = useState<string>('');

    const toast = useAppToast();

    const chakraStyleForNonChakra = {
        width: '70%',
        font: 'Russo One',
        padding: '12px 20px',
        margin: '6px 0;',
        display: 'inline-block',
        border: '1px solid #ccc',
        borderRadius: '0.375rem',
    };

    const { laborer, editMode } = props;

    const { state } = useContext(UserContext);

    return (
        <Modal isCentered size="xl" isOpen={props.isOpen} onClose={props.onClose}>
            <ModalOverlay />
            <ModalContent>
                <Heading
                    textAlign="center"
                >
                    Update Paid Laborer
                </Heading>
                <Divider />
                <ModalBody>
                    <Grid
                        templateRows="repeat(4, 1fr)"
                        templateColumns="repeat(2, 1fr)"
                        columnGap={1}
                    >
                        <GridItem colSpan={1}>
                            <Text>First Name</Text>
                            <Input
                                defaultValue={laborer?.firstName}
                                value={firstName}
                                size="md"
                                onChange={
                                    (e) => {
                                        setFirstName(_.startCase(e.target.value));
                                    }
                                }
                            />
                        </GridItem>
                        <GridItem colSpan={1}>
                            <Text>Last Name</Text>
                            <Input
                                defaultValue={laborer?.lastName}
                                value={lastName}
                                size="md"
                                onChange={
                                    (e) => {
                                        setLastName(_.startCase(e.target.value));
                                    }
                                }
                            />
                        </GridItem>
                        <GridItem colSpan={1}>
                            <Text>Business Name</Text>
                            <Input
                                defaultValue={laborer?.businessName}
                                value={businessName}
                                size="md"
                                onChange={
                                    (e) => {
                                        setBusinessName(_.startCase(e.target.value));
                                    }
                                }
                            />
                        </GridItem>
                        <GridItem colSpan={2}>
                            <Text>Phone</Text>
                            <Text size="xs">
                                Phone must be ten digits and include area code. Number formatted automatically.
                            </Text>
                            <PhoneInput
                                autocomplete="new-password"
                                style={chakraStyleForNonChakra}
                                placeHolder={laborer?.phoneNumber}
                                defaultCountry="US"
                                onChange={
                                    (e) => {
                                        setPhone(e);
                                    }
                                }
                            />
                        </GridItem>
                        <GridItem colSpan={2}>
                            <Text>email</Text>
                            <Input
                                size="md"
                                defaultValue={laborer?.email}
                                onChange={
                                    (e) => {
                                        const typedEmail = e.target.value;
                                        setEmail(typedEmail);
                                    }
                                }
                            />
                        </GridItem>
                    </Grid>
                </ModalBody>
                <ModalFooter>
                    <Button
                        backgroundColor="orange"
                        color="white"
                        onClick={
                            async () => {
                                const laborerEntry : PaidLabor = {
                                    firstName: firstName || laborer?.firstName,
                                    lastName: lastName || laborer?.lastName,
                                    businessName: businessName || laborer?.businessName,
                                    phoneNumber: phone || laborer?.phoneNumber,
                                    email: email || laborer?.email,
                                };
                                if (editMode) {
                                    // we are editing an existing entry so PUT it
                                    laborerEntry.paidLaborId = laborer?.paidLaborId || 0;
                                    await updatePaidLabor(state.token, laborerEntry);
                                } else {
                                    // It's new, so add it to the back end, yay!
                                    await createPaidLabor(state.token, laborerEntry);
                                }
                                toast.success({
                                    title: 'Paid labor info updated',
                                    description: `${JSON.stringify(laborerEntry)}`,
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
                </ModalFooter>
            </ModalContent>

        </Modal>
    );
}
PaidLaborModal.defaultProps = {
    laborer: {},
};
