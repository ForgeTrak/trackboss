/* eslint-disable no-unused-vars */
import React, { useContext, useEffect, useState } from 'react';
import { ExpanderComponentProps } from 'react-data-table-component';
import _ from 'lodash';
import { Box, Button, ButtonGroup, useDisclosure } from '@chakra-ui/react';
import { BsTrash2, BsFillTelephoneFill } from 'react-icons/bs';

import { updatePaidLabor, deletePaidLabor, createPaidLabor } from '../controller/paidLabor';
import { UserContext } from '../contexts/UserContext';
import { PaidLabor } from '../../../src/typedefs/paidLabor';
import PaidLaborModal from './modals/PaidLaborModal';

interface PaidLaborRowProps extends ExpanderComponentProps<PaidLabor> {
    // eslint-disable-next-line react/require-default-props
    updateCallback?: () => void,
}

export default function PaidLaborListRow(props: PaidLaborRowProps) {
    const { state } = useContext(UserContext);
    const { isOpen, onClose, onOpen } = useDisclosure();

    return (
        <Box>
            <ButtonGroup variant="outline" ml={10} spacing="6">
                <Button
                    background="orange.300"
                    color="white"
                    style={{ visibility: state.user?.memberType === 'Admin' ? 'visible' : 'hidden' }}
                    onClick={
                        async () => {
                            onOpen();
                        }
                    }
                >
                    Edit Paid Labor
                </Button>
                <Button
                    background="green"
                    color="white"
                    rightIcon={<BsFillTelephoneFill />}
                    isDisabled={_.isEmpty(props.data.phoneNumber)}
                    style={{ visibility: state.user?.memberType === 'Admin' ? 'visible' : 'hidden' }}
                    onClick={
                        () => {
                            window.open(`tel:${props.data.phoneNumber}`);
                        }
                    }
                >
                    Call
                </Button>
                <Button
                    aria-label="Remove"
                    background="red"
                    color="white"
                    rightIcon={<BsTrash2 />}
                    onClick={
                        async () => {
                            await deletePaidLabor(state.token, props.data.paidLaborId || 0);
                            if (props.updateCallback) {
                                await props.updateCallback();
                            }
                        }
                    }
                >
                    Delete
                </Button>
            </ButtonGroup>
            <PaidLaborModal
                laborer={props.data}
                editMode
                isOpen={isOpen}
                onClose={
                    async () => {
                        if (props.updateCallback) {
                            props.updateCallback();
                            onClose();
                        }
                    }
                }
            />
        </Box>
    );
}
