import React, { useEffect, useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalCloseButton,
    Button,
    Divider,
    Heading,
    ModalFooter,
    Text,
    VStack,
    Input,

} from '@chakra-ui/react';
import { Bike } from '../../../src/typedefs/bike';

interface modalProps {
  isOpen: boolean,
  onClose: () => void,
  bikeToEdit: Bike,
  // eslint-disable-next-line no-unused-vars
  editBike: (bikeToEdit: Bike, year: string, make: string, model: string) => void,
}

export default function EditBikesModal(props: modalProps) {
    const [bike, setBike] = useState<Bike>();

    const [bikeYear, setBikeYear] = useState<string>('');
    const [bikeMake, setBikeMake] = useState<string>('');
    const [bikeModel, setBikeModel] = useState<string>('');

    const handleEditedBikeYear = (event: { target: { value: any; }; }) => setBikeYear(event.target.value);
    const handleEditedBikeMake = (event: { target: { value: any; }; }) => setBikeMake(event.target.value);
    const handleEditedBikeModel = (event: { target: { value: any; }; }) => setBikeModel(event.target.value);

    useEffect(() => {
        async function setState() {
            setBike(props.bikeToEdit);
        }
        setState();
    }, [props.bikeToEdit]);

    return (
        <Modal isCentered size="xl" isOpen={props.isOpen} onClose={props.onClose}>
            <ModalOverlay />
            <ModalContent>
                <Heading pl={2} pr={2} textAlign="center">
                    Edit this bike
                </Heading>
                <Text fontSize="2xl" textAlign="center">
                    Current Bike Info:
                    {' '}
                    {`${bike?.year}, ${bike?.make} ${bike?.model}`}
                </Text>
                <Divider mb={5} />
                <ModalCloseButton />
                <VStack
                    align="left"
                    mr={5}
                    ml={5}
                >
                    <Input
                        variant="outline"
                        placeholder="Bike year"
                        value={bikeYear}
                        onChange={handleEditedBikeYear}
                        size="md"
                    />
                    <Input
                        variant="outline"
                        placeholder="Bike Make"
                        value={bikeMake}
                        onChange={handleEditedBikeMake}
                        size="md"
                    />
                    <Input
                        variant="outline"
                        placeholder="Bike Model"
                        value={bikeModel}
                        onChange={handleEditedBikeModel}
                        size="md"
                    />
                </VStack>
                <ModalFooter>
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
                    <Button
                        color="green"
                        variant="ghost"
                        mr={3}
                        size="lg"
                        onClick={
                            () => {
                                props.editBike(props.bikeToEdit, bikeYear, bikeMake, bikeModel);
                                props.onClose();
                            }
                        }
                    >
                        Save
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
