import React from 'react';
import { Box, Center, Input, IconButton } from '@chakra-ui/react';
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
                <Box position="relative">
                    <Box
                        position="absolute"
                        left={3}
                        top="50%"
                        transform="translateY(-50%)"
                        pointerEvents="none"
                        zIndex={1}
                    >
                        <BsSearch color="gray" />
                    </Box>
                    <Input
                        size="lg"
                        pl={10}
                        pr={10}
                        borderRadius="md"
                        placeholder="Search..."
                        value={props.searchValue}
                        onChange={
                            (e) => {
                                props.onTextChange(e.target.value?.toLowerCase());
                            }
                        }
                    />
                    <Box
                        position="absolute"
                        right={1}
                        top="50%"
                        transform="translateY(-50%)"
                    >
                        <IconButton
                            aria-label="Clear search"
                            variant="ghost"
                            size="sm"
                            onClick={() => props.onTextChange('')}
                        >
                            <BsBackspace color="gray" />
                        </IconButton>
                    </Box>
                </Box>
            </Box>
        </Center>
    );
}
