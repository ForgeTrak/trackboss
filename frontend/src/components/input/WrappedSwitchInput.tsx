import React from 'react';
import { Box, Switch, Text } from '@chakra-ui/react';
import { useAppToast } from '../../hooks/useAppToast';

interface wrappedSwitchProps {
    wrapperText: string,
    defaultChecked: boolean,
    // eslint-disable-next-line no-unused-vars
    onSwitchChange: (value: boolean) => void,
    maxWidth: number,
    locked?: boolean,
    toastMessage?: string,
    duration?: number,
}

export default function WrappedSwitchInput(props: wrappedSwitchProps) {
    const { wrapperText, defaultChecked, onSwitchChange, maxWidth, locked } = props;
    const toast = useAppToast();
    return (
        <Box maxWidth={maxWidth}>
            <Text fontSize="sm">{wrapperText}</Text>
            <Switch.Root
                colorPalette="orange"
                defaultChecked={defaultChecked}
                size="lg"
                onCheckedChange={
                    (e) => {
                        onSwitchChange(e.checked);
                        if (props.toastMessage) {
                            toast.success({
                                description: props.toastMessage,
                                duration: props.duration,
                            });
                        }
                    }
                }
                disabled={locked}
            >
                <Switch.HiddenInput />
                <Switch.Control>
                    <Switch.Thumb />
                </Switch.Control>
            </Switch.Root>
        </Box>
    );
}

WrappedSwitchInput.defaultProps = {
    locked: false,
    toastMessage: '',
    duration: 5000,
};
