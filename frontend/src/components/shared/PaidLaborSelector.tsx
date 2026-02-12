/* eslint-disable no-unused-vars */
import React, { useContext, useEffect, useState } from 'react';
import CreatableSelect from 'react-select/creatable';
import _ from 'lodash';

import { useAppDisclosure } from '../../hooks/useAppDisclosure';
import { UserContext } from '../../contexts/UserContext';
import { getPaidLaborList, createPaidLabor } from '../../controller/paidLabor';
import { PaidLabor } from '../../../../src/typedefs/paidLabor';
import PaidLaborModal from '../modals/PaidLaborModal';

interface PaidLaborSelectorProps {
    isAdmin: boolean,
    disabled: boolean,
    // eslint-disable-next-line no-unused-vars
    setSelectedOption: (option: any) => void,
}

export default function PaidLaborSelector(props: PaidLaborSelectorProps) {
    const { state } = useContext(UserContext);

    const {
        isOpen: isCreateOpen,
        onOpen: onCreateOpen,
        onClose: onCreateClose,
    } = useAppDisclosure();

    const [eligibleMembers, setEligibleMembers] = useState<any[]>([]);
    const [refreshList, setRefreshList] = useState<boolean>();
    const [newEntry, setNewEntry] = useState<PaidLabor>();

    const [selectedOption] = useState<any>();

    useEffect(() => {
        async function getData() {
            const paidLaborers = await getPaidLaborList(state.token) as PaidLabor[];
            const options = paidLaborers.map((laborer) => {
                let laborerName = `${laborer.lastName}, ${laborer.firstName}`;
                if (!laborer.lastName || !laborer.firstName) {
                    laborerName = laborer.businessName || '';
                }
                const option = {
                    value: laborer.paidLaborId,
                    label: laborerName,
                };
                return option;
            });
            options.sort((a, b) => a.label.localeCompare(b.label));
            setEligibleMembers(options);
        }
        getData();
    }, [refreshList]);

    return (
        <>
            <CreatableSelect
                placeholder="Choose paid labor, type to narrow down the list, or add a new name"
                styles={
                    {
                        option: (provided, optionState) => ({
                            ...provided,
                            backgroundColor: optionState.isSelected ? '#ffa24d' : 'white',
                            borderBottom: '1px solid #ffa24d',
                        }),
                    }
                }
                getOptionLabel={(option) => option.label}
                getOptionValue={(option) => option.value}
                isSearchable
                isClearable
                backspaceRemovesValue
                createOptionPosition="first"
                options={eligibleMembers}
                value={selectedOption}
                isDisabled={props.disabled && !props.isAdmin}
                onChange={
                    async (e) => {
                        props.setSelectedOption(e);
                    }
                }
                onCreateOption={
                    async (inputValue) => {
                        const nameValue = inputValue.split(' ');
                        const newLabor: PaidLabor = {
                            firstName: _.startCase(nameValue[0]),
                            lastName: _.startCase(nameValue[1]),
                        };
                        setNewEntry(newLabor);
                        onCreateOpen();
                    }
                }
                openMenuOnClick
                openMenuOnFocus
            />
            <PaidLaborModal
                isOpen={isCreateOpen}
                onClose={
                    () => {
                        setRefreshList(true);
                        onCreateClose();
                    }
                }
                editMode={false}
                laborer={newEntry}
            />
        </>
    );
}
