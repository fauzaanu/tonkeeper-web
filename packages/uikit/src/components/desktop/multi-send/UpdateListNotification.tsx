import styled from 'styled-components';
import { Body2, Label1 } from '../../Text';
import { Notification } from '../../Notification';
import React, { FC, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { InputBlockStyled, InputFieldStyled } from './InputStyled';
import { Button } from '../../fields/Button';
import { useUserMultiSendLists } from '../../../state/multiSend';

const NotificationBodyStyled = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 1rem 1rem;
`;

const Body2Secondary = styled(Body2)`
    color: ${props => props.theme.textTertiary};
    margin-top: 4px;
    margin-bottom: 24px;
    max-width: 304px;
    text-align: center;
`;

const ThreeButtonsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
`;

const ButtonsContainer = styled.div`
    display: flex;
    margin-top: 2rem;
    gap: 0.5rem;
    width: 100%;

    > * {
        flex: 1;
    }
`;

export const UpdateListNotification: FC<{
    isOpen: boolean;
    onCancel: () => void;
    onSave: (name: string) => void;
    onUpdate: () => void;
    listName: string;
    rowsNumber: number;
    totalValue: string;
    willDiscard: boolean;
}> = ({ isOpen, onCancel, onSave, listName, rowsNumber, totalValue, onUpdate, willDiscard }) => {
    const [openedContent, setOpenedContent] = useState<'update' | 'save'>('update');

    useEffect(() => {
        if (!isOpen) {
            setOpenedContent('update');
        }
    }, [isOpen]);

    return (
        <Notification isOpen={isOpen} handleClose={onCancel}>
            {() =>
                openedContent === 'update' ? (
                    <UpdateContent
                        listName={listName}
                        onUpdate={onUpdate}
                        onSave={() => setOpenedContent('save')}
                        onCancel={onCancel}
                        willDiscard={willDiscard}
                    />
                ) : (
                    <SaveContent
                        onSave={onSave}
                        onCancel={() => setOpenedContent('update')}
                        rowsNumber={rowsNumber}
                        totalValue={totalValue}
                    />
                )
            }
        </Notification>
    );
};

const UpdateContent: FC<{
    listName: string;
    onUpdate: () => void;
    onSave: () => void;
    onCancel: () => void;
    willDiscard: boolean;
}> = ({ listName, onSave, onUpdate, onCancel, willDiscard }) => {
    return (
        <NotificationBodyStyled>
            <Label1>Update &apos;{listName}&apos;?</Label1>
            <Body2Secondary>Update the information in the current list.</Body2Secondary>
            <ThreeButtonsContainer>
                <Button primary onClick={onUpdate}>
                    Update
                </Button>
                <Button secondary onClick={onSave}>
                    Save as New
                </Button>
                <Button secondary onClick={onCancel}>
                    {willDiscard ? 'Discard and Close' : 'Close'}
                </Button>
            </ThreeButtonsContainer>
        </NotificationBodyStyled>
    );
};

const SaveContent: FC<{
    onSave: (name: string) => void;
    onCancel: () => void;
    rowsNumber: number;
    totalValue: string;
}> = ({ onSave, onCancel, totalValue, rowsNumber }) => {
    const { data: lists } = useUserMultiSendLists();
    const maxId = lists ? Math.max(1, ...lists.map(l => l.id)) : undefined;
    const [inputValue, setInputValue] = useState('');
    const changedInput = useRef(false);

    useLayoutEffect(() => {
        if (maxId !== undefined && !changedInput.current) {
            setInputValue('List ' + (maxId + 1));
            changedInput.current = true;
        }
    }, [maxId]);

    return (
        <NotificationBodyStyled>
            <Label1>Save this List?</Label1>
            <Body2Secondary>
                Save the list with addresses, amounts, and comments for future use.
            </Body2Secondary>
            <NameInput
                inputValue={inputValue}
                rowsNumber={rowsNumber}
                totalValue={totalValue}
                setInputValue={setInputValue}
            />
            <ButtonsContainer>
                <Button secondary onClick={onCancel}>
                    Cancel
                </Button>
                <Button primary onClick={() => onSave(inputValue)} disabled={!inputValue}>
                    Save
                </Button>
            </ButtonsContainer>
        </NotificationBodyStyled>
    );
};

const Dot = styled(Body2)`
    color: ${props => props.theme.textTertiary};
`;

const InputRight = styled.div`
    color: ${props => props.theme.textSecondary};
`;

const InputFieldRegular = styled(InputFieldStyled)`
    font-family: inherit;
`;

const NameInput: FC<{
    inputValue: string;
    rowsNumber: number;
    totalValue: string;
    setInputValue: (s: string) => void;
}> = ({ inputValue, setInputValue, rowsNumber, totalValue }) => {
    const [focus, setFocus] = useState(true);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    return (
        <InputBlockStyled valid={inputValue !== ''} focus={focus}>
            <InputFieldRegular
                ref={inputRef}
                onChange={e => {
                    setInputValue(e.target.value);
                }}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                value={inputValue}
                placeholder="List name"
            />
            <InputRight>
                <Body2>{rowsNumber}&nbsp;wallets</Body2>
                &nbsp;
                <Dot>·</Dot>
                &nbsp;
                <Body2>{totalValue}</Body2>
            </InputRight>
        </InputBlockStyled>
    );
};
