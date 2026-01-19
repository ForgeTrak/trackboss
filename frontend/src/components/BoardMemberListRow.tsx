import React, { useContext, useEffect, useState } from 'react';
import { ExpanderComponentProps } from 'react-data-table-component';
import { Box } from '@chakra-ui/react';
import { useAppToast } from '../hooks/useAppToast';
import MemberSelector from './shared/MemberSelector';
import { BoardMember, PatchBoardMemberRequest } from '../../../src/typedefs/boardMember';
import { updateBoardMember } from '../controller/boardMember';
import { UserContext } from '../contexts/UserContext';

interface BoardMemberRowProps extends ExpanderComponentProps<BoardMember> {
    // eslint-disable-next-line react/require-default-props
    year?: number,
    // eslint-disable-next-line react/require-default-props
    updateCallback?: () => void,
}

export default function BoardMemberListRow(props:BoardMemberRowProps) {
    const { state } = useContext(UserContext);
    const [selectedOption, setSelectedOption] = useState<any>();
    const toast = useAppToast();

    useEffect(() => {
        async function updateBoardMemberRow() {
            if (selectedOption) {
                const updateBoard: PatchBoardMemberRequest = {
                    boardMemberTitleId: props.data.titleId,
                    year: props.year,
                    memberId: selectedOption.value,
                };
                try {
                    await updateBoardMember(state.token, props.data.boardId, updateBoard);
                } catch (error) {
                    toast.error({
                        title: `Unable to change board member ${props.data.title}`,
                    });
                }
                if (props.updateCallback) {
                    props.updateCallback();
                }
            }
        }
        updateBoardMemberRow();
    }, [selectedOption]);

    return (
        <Box>
            <MemberSelector
                isAdmin
                setSelectedOption={setSelectedOption}
                disabled={false}
            />
        </Box>
    );
}
