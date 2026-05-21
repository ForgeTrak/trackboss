import React from 'react';
import { Box, Center, Group, Input, IconButton } from '@chakra-ui/react';
import { BsBackspace, BsSearch } from 'react-icons/bs';

interface dataSearchBoxProps {
    searchValue: string,
    // this eslint rule is a tough guy about the unused var but I like it for clarity so I disabled this rule.
    // eslint-disable-next-line no-unused-vars
    onTextChange: (value: string) => void,
}
export default function DataSearchBox(props: dataSearchBoxProps) {
    return (
        <Center>
            <Box maxWidth={500} padding={5}>
                <Group attached>
                    <Box pointerEvents="none" display="flex" alignItems="center" pl={3}>
                        <BsSearch color="gray" />
                    </Box>
                    <Input
                        size="lg"
                        placeholder="Search..."
                        value={props.searchValue}
                        onChange={
                            (e) => {
                                props.onTextChange(e.target.value?.toLowerCase());
                            }
                        }
                    />
                    <IconButton
                        aria-label="Clear search"
                        variant="ghost"
                        onClick={() => props.onTextChange('')}
                    >
                        <BsBackspace color="gray" />
                    </IconButton>
                </Group>
            </Box>
        </Center>
    );
}
