import React, { useEffect, useState } from 'react';
import {
    Button,
    Grid,
    GridItem,
    Input,
    NativeSelect,
    NumberInput,
    Text,
} from '@chakra-ui/react';
import AppModal, { AppModalBody, AppModalCloseButton, AppModalFooter, AppModalHeader } from '../AppModal';
import { Bike } from '../../../../src/typedefs/bike';

const BIKE_MAKES = [
    'Beta',
    'Cobra',
    'Gas Gas',
    'GPX',
    'Honda',
    'Husqvarna',
    'Kawasaki',
    'KTM',
    'Other',
    'Pitster Pro',
    'Suzuki',
    'Yamaha',
];

interface BikeModalProps {
    isOpen: boolean,
    onClose: () => void,
    // eslint-disable-next-line no-unused-vars
    onSave: (year: string, make: string, model: string) => void,
    bikeToEdit?: Bike,
}

export default function BikeModal(props: BikeModalProps) {
    const { isOpen, onClose, onSave, bikeToEdit } = props;
    const isEditMode = !!bikeToEdit;

    const thisYear = (new Date()).getFullYear();
    const minModelYear = thisYear - 55;
    const maxModelYear = thisYear + 1;

    const [bikeYear, setBikeYear] = useState<string>(String(maxModelYear));
    const [bikeMake, setBikeMake] = useState<string>('');
    const [bikeModel, setBikeModel] = useState<string>('');

    useEffect(() => {
        if (bikeToEdit) {
            setBikeYear(bikeToEdit.year || '');
            setBikeMake(bikeToEdit.make || '');
            setBikeModel(bikeToEdit.model || '');
        } else {
            setBikeYear(String(maxModelYear));
            setBikeMake('');
            setBikeModel('');
        }
    }, [bikeToEdit]);

    return (
        <AppModal size="xl" isOpen={isOpen} onClose={onClose}>
            <AppModalCloseButton />
            <AppModalHeader>
                {isEditMode ? 'Edit Bike' : 'Add New Bike'}
            </AppModalHeader>
            <AppModalBody>
                {
                    isEditMode && bikeToEdit && (
                        <Text fontSize="lg" mb={2}>
                            {`Current: ${bikeToEdit.year} ${bikeToEdit.make} ${bikeToEdit.model}`}
                        </Text>
                    )
                }
                <Grid
                    templateColumns="repeat(2, 1fr)"
                    columnGap={2}
                    rowGap={2}
                >
                    <GridItem colSpan={1}>
                        <Text>Year</Text>
                        <NumberInput.Root
                            variant="outline"
                            defaultValue={bikeYear}
                            value={bikeYear}
                            min={minModelYear}
                            max={maxModelYear}
                            onValueChange={(e) => setBikeYear(e.value)}
                        >
                            <NumberInput.Input />
                            <NumberInput.Control>
                                <NumberInput.IncrementTrigger />
                                <NumberInput.DecrementTrigger />
                            </NumberInput.Control>
                        </NumberInput.Root>
                    </GridItem>
                    <GridItem colSpan={1}>
                        <Text>Make</Text>
                        <NativeSelect.Root size="md">
                            <NativeSelect.Field
                                placeholder="Select make"
                                value={bikeMake}
                                onChange={(e) => setBikeMake(e.target.value)}
                            >
                                {
                                    BIKE_MAKES.map((make) => (
                                        <option key={make} value={make}>{make}</option>
                                    ))
                                }
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                        </NativeSelect.Root>
                    </GridItem>
                    <GridItem colSpan={2}>
                        <Text>Model</Text>
                        <Input
                            variant="outline"
                            placeholder="Bike Model"
                            value={bikeModel}
                            onChange={(e) => setBikeModel(e.target.value)}
                            size="md"
                        />
                    </GridItem>
                </Grid>
            </AppModalBody>
            <AppModalFooter>
                <Button
                    backgroundColor="orange"
                    color="white"
                    mr={3}
                    size="lg"
                    onClick={
                        () => {
                            onSave(bikeYear, bikeMake, bikeModel);
                            onClose();
                        }
                    }
                >
                    Save
                </Button>
                <Button variant="outline" onClick={onClose}>
                    Close
                </Button>
            </AppModalFooter>
        </AppModal>
    );
}
BikeModal.defaultProps = {
    bikeToEdit: undefined,
};
