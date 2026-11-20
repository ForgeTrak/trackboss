import { Box, Button, Center, HStack, IconButton, Input, VStack } from '@chakra-ui/react';
import React, { useContext, useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import { BsArrowDown, BsArrowUp, BsSearch } from 'react-icons/bs';
import { useAppDisclosure } from '../hooks/useAppDisclosure';

import { Link } from '../../../src/typedefs/link';
import { UserContext } from '../contexts/UserContext';
import LinkListRow from './LinkListRow';
import LinkModal from './modals/LinkModal';

import { getAllLinks, updateLink } from '../controller/links';

const customStyles = {
    rows: {
        style: {
            minHeight: '65px',
        },
    },
    headCells: {
        style: {
            marginTop: '20px',
            paddingTop: '0',
            fontSize: '1.5em',
            backgroundColor: '#f9f9f9',
            color: '#626262',
        },
    },
    cells: {
        style: {
            fontSize: '1.2em',
        },
    },
};

export default function LinkList() {
    const [cells, setCells] = useState<Link[]>([]);
    const [allCells, setAllCells] = useState<Link[]>([]);

    const { state } = useContext(UserContext);
    const [error, setError] = useState<any | undefined>(undefined);

    const [searchTerm, setSearchTerm] = useState<string>('');

    const { isOpen: isCreateOpen, onClose: onCreateClose, onOpen: onCreateOpen } = useAppDisclosure();

    async function getLinkData() {
        let links: Link[] = [];
        try {
            links = await getAllLinks(state.token) as Link[];
        } catch (e) {
            setError(e);
        }
        setCells(links);
        setAllCells(links);
    }

    async function moveLink(index: number, direction: 'up' | 'down') {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= allCells.length) {
            return;
        }
        const reordered = [...allCells];
        const temp = reordered[index];
        reordered[index] = reordered[targetIndex];
        reordered[targetIndex] = temp;

        const updates: Promise<any>[] = [];
        const normalized = reordered.map((item, idx) => {
            const newOrder = idx + 1;
            if (item.linkDisplayOrder !== newOrder) {
                const updatedItem = { ...item, linkDisplayOrder: newOrder };
                updates.push(updateLink(state.token, updatedItem));
                return updatedItem;
            }
            return item;
        });

        setAllCells(normalized);
        setCells(normalized);

        await Promise.all(updates);
        await getLinkData();
    }

    const renderOrderCell = (row: Link) => {
        const onlineCells = allCells.filter((c) => c.online);
        const rowIndex = allCells.findIndex((c) => c.linkId === row.linkId);
        const onlineIndex = onlineCells.findIndex((c) => c.linkId === row.linkId);
        const isFirst = !row.online || onlineIndex <= 0;
        const isLast = !row.online || onlineIndex === -1 || onlineIndex >= onlineCells.length - 1;
        const isFiltering = searchTerm !== '';
        return (
            <HStack gap={1}>
                <IconButton
                    aria-label="Move link up"
                    size="sm"
                    variant="outline"
                    disabled={isFirst || isFiltering}
                    onClick={() => moveLink(rowIndex, 'up')}
                >
                    <BsArrowUp />
                </IconButton>
                <IconButton
                    aria-label="Move link down"
                    size="sm"
                    variant="outline"
                    disabled={isLast || isFiltering}
                    onClick={() => moveLink(rowIndex, 'down')}
                >
                    <BsArrowDown />
                </IconButton>
            </HStack>
        );
    };

    const columns: any = [
        {
            name: 'Order',
            selector: (row: Link) => row.linkDisplayOrder ?? 0,
            maxWidth: '140px',
            cell: renderOrderCell,
        },
        {
            name: 'Title',
            selector: (row: Link) => row.linkTitle,
            sortable: true,
        },
        {
            name: 'URL',
            selector: (row: Link) => row.linkUrl,
            sortable: true,
        },
        {
            name: 'Status',
            selector: (row: Link) => (row.online ? 'Online' : 'Offline'),
            sortable: true,
        },
    ];

    useEffect(() => {
        getLinkData();
    }, []);

    useEffect(() => {
        if (searchTerm === '') {
            setCells(allCells);
        } else {
            const newCells =
                allCells.filter((cell: Link) => {
                    const titleFound = cell.linkTitle?.toLowerCase().includes(searchTerm);
                    const urlFound = cell.linkUrl?.toLowerCase().includes(searchTerm);
                    return (titleFound || urlFound);
                });
            setCells(newCells);
        }
    }, [searchTerm, allCells]);

    if (error) {
        return (
            <div>
                {error.reason}
            </div>
        );
    }
    return (
        <div>
            <Center>
                <VStack>
                    <Box maxWidth={300} position="relative">
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
                            borderRadius="md"
                            placeholder="Search..."
                            onChange={(e) => setSearchTerm(e.target.value?.toLowerCase())}
                        />
                    </Box>
                    <Button
                        backgroundColor="orange.300"
                        color="white"
                        onClick={
                            () => {
                                onCreateOpen();
                            }
                        }
                    >
                        Create new link
                    </Button>
                </VStack>
            </Center>
            <DataTable
                columns={columns}
                data={cells}
                fixedHeaderScrollHeight="300px"
                highlightOnHover
                expandableRows={state.user?.memberType === 'Admin'}
                expandableRowsComponent={LinkListRow}
                expandableRowsComponentProps={
                    {
                        updateCallback: getLinkData,
                    }
                }
                pagination
                paginationPerPage={20}
                responsive
                striped
                subHeaderWrap
                customStyles={customStyles}
                paginationComponentOptions={
                    {
                        selectAllRowsItem: true,
                    }
                }
            />
            <LinkModal
                editMode={false}
                isOpen={isCreateOpen}
                onClose={
                    () => {
                        onCreateClose();
                        getLinkData();
                    }
                }
            />
        </div>
    );
}
