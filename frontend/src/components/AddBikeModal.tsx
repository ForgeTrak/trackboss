import React, { useState } from 'react';
import {
    Button,
    Heading,
    VStack,
    Input,
    NativeSelect,
    NumberInput,
} from '@chakra-ui/react';
import AppModal, { AppModalBody, AppModalCloseButton, AppModalFooter, AppModalHeader } from './AppModal';

interface modalProps {
  isOpen: boolean,
  onClose: () => void,
  // eslint-disable-next-line no-unused-vars
  addBike: (year: string, make: string, model: string) => void,
}

export default function EditBikesModal(props: modalProps) {
    const [bikeYear, setBikeYear] = useState<string>('');
    const [bikeMake, setBikeMake] = useState<string>('');
    const [bikeModel, setBikeModel] = useState<string>('');

    const handleEditedBikeYear = (event: { target: { value: any; }; }) => setBikeYear(event.target.value);
    const handleEditedBikeMake = (event: { target: { value: any; }; }) => setBikeMake(event.target.value);
    const handleEditedBikeModel = (event: { target: { value: any; }; }) => setBikeModel(event.target.value);
    const thisYear = (new Date()).getFullYear();
    const minModelYear = thisYear - 55;
    const maxModelYear = thisYear + 1;

    return (
        <AppModal size="xl" isOpen={props.isOpen} onClose={props.onClose}>
            <AppModalHeader>
                <Heading textAlign="center">Add New Bike</Heading>
            </AppModalHeader>
            <AppModalCloseButton />
            <AppModalBody>
                <VStack align="left">
                    <NumberInput.Root
                        variant="outline"
                        defaultValue={String(maxModelYear)}
                        min={minModelYear}
                        max={maxModelYear}
                    >
                        <NumberInput.Input onChange={handleEditedBikeYear} />
                        <NumberInput.Control>
                            <NumberInput.IncrementTrigger />
                            <NumberInput.DecrementTrigger />
                        </NumberInput.Control>
                    </NumberInput.Root>
                    <NativeSelect.Root size="md">
                        <NativeSelect.Field
                            placeholder="Bike Make"
                            onChange={handleEditedBikeMake}
                        >
                            <option value="Beta">Beta</option>
                            <option value="Cobra">Cobra</option>
                            <option value="Gas Gas">Gas Gas</option>
                            <option value="GPX">GPX</option>
                            <option value="Honda">Honda</option>
                            <option value="Husqvarna">Husqvarna</option>
                            <option value="Kawasaki">Kawasaki</option>
                            <option value="KTM">KTM</option>
                            <option value="Other">Other</option>
                            <option value="Pitster Pro">Pitster Pro</option>
                            <option value="Suzuki">Suzuki</option>
                            <option value="Yamaha">Yamaha</option>
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                    </NativeSelect.Root>
                    <Input
                        variant="outline"
                        placeholder="Bike Model"
                        value={bikeModel}
                        onChange={handleEditedBikeModel}
                        size="md"
                    />
                </VStack>
            </AppModalBody>
            <AppModalFooter>
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
                            props.addBike(bikeYear, bikeMake, bikeModel);
                            props.onClose();
                        }
                    }
                >
                    Save
                </Button>
            </AppModalFooter>
        </AppModal>
    );
}
