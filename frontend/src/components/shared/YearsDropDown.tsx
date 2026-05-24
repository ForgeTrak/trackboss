import React, { useState } from 'react';
import { Button, Heading, HStack, Menu, Portal } from '@chakra-ui/react';
import { BsChevronDown } from 'react-icons/bs';
import _ from 'lodash';

interface YearsDropDownProps {
    years: number[],
    // eslint-disable-next-line react/require-default-props
    header?: string,
    // eslint-disable-next-line no-unused-vars
    setYear: (value: number) => void,
    initialYear: number,
}

export default function YearsDropDown(props: YearsDropDownProps) {
    const currentYear = (new Date()).getFullYear();
    const [year, setYear] = useState<number>(props.initialYear);
    if (!props.years || (props.years.length === 0)) {
        props.years.push(currentYear);
    }

    return (
        <HStack align="center">
            <Menu.Root>
                <Menu.Trigger asChild>
                    <Button bg="orange" color="white">
                        Past Years
                        <BsChevronDown />
                    </Button>
                </Menu.Trigger>
                <Portal>
                    <Menu.Positioner>
                        <Menu.Content>
                            {
                                // eslint-disable-next-line arrow-body-style
                                _.map(props.years, (listYear) => (
                                    <Menu.Item
                                        key={listYear}
                                        onClick={
                                            () => {
                                                props.setYear(listYear);
                                                setYear(listYear);
                                            }
                                        }
                                        value={String(listYear)}
                                    >
                                        {listYear}
                                    </Menu.Item>
                                ))
                            }
                        </Menu.Content>
                    </Menu.Positioner>
                </Portal>
            </Menu.Root>
            <Heading size="lg">
                {props.header}
                (
                {year}
                )
            </Heading>
        </HStack>
    );
}
