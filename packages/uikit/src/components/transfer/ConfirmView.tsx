import { useMutation } from '@tanstack/react-query';
import { AmountData, RecipientData } from '@tonkeeper/core/dist/entries/send';
import { sendTonTransfer } from '@tonkeeper/core/dist/service/transfer/tonService';
import { JettonsBalances } from '@tonkeeper/core/dist/tonApiV1';
import { toShortAddress } from '@tonkeeper/core/dist/utils/common';
import { getJettonSymbol } from '@tonkeeper/core/dist/utils/send';

import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import React, { FC, useMemo, useState } from 'react';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useFormatCoinValue } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { getWalletPassword } from '../../state/password';
import { TransferComment } from '../activity/ActivityActionDetails';
import { BackButton } from '../fields/BackButton';
import { Button } from '../fields/Button';
import {
  CheckmarkCircleIcon,
  ChevronLeftIcon,
  ExclamationMarkCircleIcon,
} from '../Icon';
import { ColumnText, Gap } from '../Layout';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import {
  FullHeightBlock,
  NotificationCancelButton,
  NotificationTitleBlock,
} from '../Notification';
import { Label1, Label2 } from '../Text';
import { ButtonBlock, Label, ResultButton, useFiatAmount } from './common';
import { Image, ImageMock, Info, SendingTitle, Title } from './Confirm';

const useSendTransaction = (
  recipient: RecipientData,
  amount: AmountData,
  jettons: JettonsBalances
) => {
  const sdk = useAppSdk();
  const { tonApi } = useAppContext();
  const wallet = useWalletContext();

  return useMutation<void, Error>(async () => {
    const password = await getWalletPassword(sdk);
    if (amount.jetton === CryptoCurrency.TON) {
      return sendTonTransfer(
        sdk.storage,
        tonApi,
        wallet,
        recipient,
        amount,
        password
      );
    } else {
      const [jettonInfo] = jettons.balances.filter(
        (item) => item.jettonAddress === amount.jetton
      );
      throw new Error('Undone');
    }
  });
};

export const ConfirmView: FC<{
  recipient: RecipientData;
  amount: AmountData;
  jettons: JettonsBalances;
  onBack: () => void;
  onClose: () => void;
  width: number;
}> = ({ recipient, onBack, onClose, width, amount, jettons }) => {
  const [done, setDone] = useState(false);
  const { t } = useTranslation();
  const sdk = useAppSdk();

  const { mutateAsync, isLoading, error } = useSendTransaction(
    recipient,
    amount,
    jettons
  );

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (isLoading) return;
    try {
      await mutateAsync();
      setDone(true);
      setTimeout(onClose, 2000);
    } catch (e) {}
  };

  const isValid = !isLoading;

  const fiatAmount = useFiatAmount(jettons, amount.jetton, amount.amount);
  const coinAmount = `${amount.amount} ${getJettonSymbol(
    amount.jetton,
    jettons
  )}`;

  const format = useFormatCoinValue();
  const feeAmount = useMemo(() => format(amount.fee.total), [format, amount]);
  const fiatFeeAmount = useFiatAmount(jettons, CryptoCurrency.TON, feeAmount);

  return (
    <FullHeightBlock onSubmit={onSubmit}>
      <NotificationTitleBlock>
        <BackButton onClick={onBack}>
          <ChevronLeftIcon />
        </BackButton>
        <NotificationCancelButton handleClose={onClose} />
      </NotificationTitleBlock>
      <Info>
        {recipient.toAccount.icon ? (
          <Image full src={recipient.toAccount.icon} />
        ) : (
          <ImageMock full />
        )}
        <SendingTitle>{t('confirm_sending_title')}</SendingTitle>
        <Title>
          {recipient.toAccount.name
            ? recipient.toAccount.name
            : t('txActions_signRaw_types_tonTransfer')}
        </Title>
      </Info>
      <ListBlock margin={false} fullWidth>
        <ListItem
          onClick={() => sdk.copyToClipboard(recipient.address.address)}
        >
          <ListItemPayload>
            <Label>{t('txActions_signRaw_recipient')}</Label>
            <Label1>{toShortAddress(recipient.address.address)}</Label1>
          </ListItemPayload>
        </ListItem>
        <ListItem onClick={() => sdk.copyToClipboard(coinAmount)}>
          <ListItemPayload>
            <Label>{t('txActions_amount')}</Label>
            {fiatAmount ? (
              <ColumnText
                right
                text={coinAmount}
                secondary={<>≈&thinsp;{fiatAmount}</>}
              />
            ) : (
              <Label1>{coinAmount}</Label1>
            )}
          </ListItemPayload>
        </ListItem>
        <ListItem
          onClick={() =>
            sdk.copyToClipboard(`${feeAmount} ${CryptoCurrency.TON}`)
          }
        >
          <ListItemPayload>
            <Label>{t('txActions_fee')}</Label>
            <ColumnText
              right
              text={
                <>
                  ≈&thinsp;{feeAmount} {CryptoCurrency.TON}
                </>
              }
              secondary={<>≈&thinsp;{fiatFeeAmount}</>}
            />
          </ListItemPayload>
        </ListItem>
        <TransferComment
          comment={
            amount.jetton === CryptoCurrency.TON ? recipient.comment : undefined
          }
        />
      </ListBlock>
      <Gap />

      <ButtonBlock width={width}>
        {done && (
          <ResultButton done>
            <CheckmarkCircleIcon />
            <Label2>{t('send_screen_steps_done_done_label')}</Label2>
          </ResultButton>
        )}
        {error && (
          <ResultButton>
            <ExclamationMarkCircleIcon />
            <Label2>{t('send_publish_tx_error')}</Label2>
          </ResultButton>
        )}
        {!done && !error && (
          <Button
            fullWidth
            size="large"
            primary
            type="submit"
            disabled={!isValid}
            loading={isLoading}
          >
            {t('confirm_sending_submit')}
          </Button>
        )}
      </ButtonBlock>
    </FullHeightBlock>
  );
};
