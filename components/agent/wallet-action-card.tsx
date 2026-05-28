'use client';

import { useState } from 'react';
import {
  useReadContract,
  useWriteContract,
  useSendTransaction,
  useSignTypedData,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
} from 'wagmi';
import { useAppKitAccount } from '@reown/appkit/react';
import type { WalletAction } from '@/lib/lifi/types';
import { ERC20_APPROVE_ABI, ERC20_ALLOWANCE_ABI } from '@/lib/wallet/erc20';

type Props = {
  action: WalletAction;
  onSendMessage: (text: string) => void;
};

export function WalletActionCard({ action, onSendMessage }: Props) {
  switch (action.type) {
    case 'connect-wallet':
      return <ConnectCard reason={action.reason} />;
    case 'approve-erc20':
      return <ApproveCard action={action} onSendMessage={onSendMessage} />;
    case 'send-transaction':
      return <SendTxCard action={action} onSendMessage={onSendMessage} />;
    case 'sign-typed-data':
      return <SignTypedDataCard action={action} onSendMessage={onSendMessage} />;
    case 'confirm-submit':
      return <ConfirmSubmitCard action={action} onSendMessage={onSendMessage} />;
  }
}

// ── Connect wallet ────────────────────────────────────────────────────────────

function ConnectCard({ reason }: { reason: string }) {
  return (
    <div className="rounded-xl border border-(--c-border2) bg-(--c-surface) p-4 text-sm">
      <p className="mb-2 text-(--c-text2)">{reason}</p>
      <p className="text-xs text-(--c-text3)">Please connect your wallet using the button in the header.</p>
    </div>
  );
}

// ── ERC-20 Approve ────────────────────────────────────────────────────────────

function ApproveCard({
  action,
  onSendMessage,
}: {
  action: Extract<WalletAction, { type: 'approve-erc20' }>;
  onSendMessage: (text: string) => void;
}) {
  const { address } = useAppKitAccount();
  const [done, setDone] = useState(false);

  const { data: allowance } = useReadContract({
    address: action.token,
    abi: ERC20_ALLOWANCE_ABI,
    functionName: 'allowance',
    args: address ? [address as `0x${string}`, action.spender] : undefined,
    chainId: action.chainId,
    query: { enabled: !!address },
  });

  const requiredAmount = BigInt(action.amount);
  const alreadyApproved = allowance !== undefined && allowance >= requiredAmount;

  const { writeContract, data: approveTxHash, isPending, isError, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: approveTxHash,
    chainId: action.chainId,
  });

  if (isSuccess && !done) {
    setDone(true);
    onSendMessage(
      `ERC-20 approval confirmed. Transaction hash: ${approveTxHash}. You can now proceed with the deposit.`
    );
  }

  if (alreadyApproved && !done) {
    setDone(true);
    onSendMessage(
      `ERC-20 allowance already sufficient (current: ${allowance?.toString()}). You can proceed directly with the deposit.`
    );
  }

  return (
    <ActionCard
      title="Approve Token Spend"
      badge="Step 1 of 2"
      badgeColor="yellow"
      reason={action.reason}
      detail={`Token: ${action.token}\nSpender: ${action.spender}\nAmount: ${action.amount}`}
      targetChainId={action.chainId}
      isLoading={isPending || isConfirming}
      isSuccess={isSuccess || alreadyApproved}
      isError={isError}
      errorMessage={error?.message}
      buttonLabel={alreadyApproved ? 'Already Approved ✓' : isPending ? 'Confirm in wallet…' : isConfirming ? 'Confirming…' : 'Approve'}
      onExecute={() =>
        writeContract({
          address: action.token,
          abi: ERC20_APPROVE_ABI,
          functionName: 'approve',
          args: [action.spender, requiredAmount],
          chainId: action.chainId,
        })
      }
      disabled={alreadyApproved || isPending || isConfirming || isSuccess}
    />
  );
}

// ── Send Transaction ──────────────────────────────────────────────────────────

function SendTxCard({
  action,
  onSendMessage,
}: {
  action: Extract<WalletAction, { type: 'send-transaction' }>;
  onSendMessage: (text: string) => void;
}) {
  const [done, setDone] = useState(false);

  const { sendTransaction, data: txHash, isPending, isError, error } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: action.chainId,
  });

  if (isSuccess && receipt && !done) {
    setDone(true);
    // Extract onChainOrderId from the Open event emitted by InputSettlerEscrow
    // Event: Open(bytes32 indexed orderId, ...) — orderId is topics[1]
    const openLog = receipt.logs.find(
      (log) => log.address.toLowerCase() === action.to.toLowerCase()
    );
    const onChainOrderId = openLog?.topics?.[1];
    const orderIdPart = onChainOrderId
      ? ` On-chain order ID: ${onChainOrderId}.`
      : '';
    onSendMessage(
      `Escrow deposit confirmed. Transaction hash: ${txHash}.${orderIdPart} Call trackOrder with the onChainOrderId to monitor status.`
    );
  }

  return (
    <ActionCard
      title="Send Deposit Transaction"
      badge="Step 2 of 2"
      badgeColor="blue"
      reason={action.reason}
      detail={`To: ${action.to}\nChain: ${action.chainId}${action.value && action.value !== '0' ? `\nValue: ${action.value} wei` : ''}`}
      targetChainId={action.chainId}
      isLoading={isPending || isConfirming}
      isSuccess={isSuccess}
      isError={isError}
      errorMessage={error?.message}
      buttonLabel={isPending ? 'Confirm in wallet…' : isConfirming ? 'Confirming…' : 'Send Deposit'}
      onExecute={() =>
        sendTransaction({
          to: action.to,
          data: action.data,
          value: action.value ? BigInt(action.value) : BigInt(0),
          chainId: action.chainId,
        })
      }
      disabled={isPending || isConfirming || isSuccess}
    />
  );
}

// ── Sign Typed Data ───────────────────────────────────────────────────────────

function SignTypedDataCard({
  action,
  onSendMessage,
}: {
  action: Extract<WalletAction, { type: 'sign-typed-data' }>;
  onSendMessage: (text: string) => void;
}) {
  const [done, setDone] = useState(false);

  const { signTypedData, data: signature, isPending, isError, isSuccess, error } = useSignTypedData();

  if (isSuccess && signature && !done) {
    setDone(true);
    onSendMessage(`Typed data signed. Signature: ${signature}. Please submit the order now.`);
  }

  return (
    <ActionCard
      title="Sign Order"
      badge="Signature required"
      badgeColor="purple"
      reason={action.reason}
      detail="Sign the EIP-712 typed data to authorise this cross-chain order."
      isLoading={isPending}
      isSuccess={isSuccess}
      isError={isError}
      errorMessage={error?.message}
      buttonLabel={isPending ? 'Sign in wallet…' : 'Sign Order'}
      onExecute={() =>
        signTypedData(action.typedData as Parameters<typeof signTypedData>[0])
      }
      disabled={isPending || isSuccess}
    />
  );
}

// ── Confirm Submit ────────────────────────────────────────────────────────────

function ConfirmSubmitCard({
  action,
  onSendMessage,
}: {
  action: Extract<WalletAction, { type: 'confirm-submit' }>;
  onSendMessage: (text: string) => void;
}) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <ActionCard
      title="Confirm Order Submission"
      badge="Final step"
      badgeColor="green"
      reason={action.reason}
      detail={action.quoteId ? `Quote ID: ${action.quoteId}` : ''}
      isLoading={false}
      isSuccess={confirmed}
      isError={false}
      buttonLabel={confirmed ? 'Confirmed ✓' : 'Confirm & Submit'}
      onExecute={() => {
        setConfirmed(true);
        onSendMessage(
          `User confirmed order submission.${action.quoteId ? ` Quote ID: ${action.quoteId}.` : ''} Please call submitOrder now.`
        );
      }}
      disabled={confirmed}
    />
  );
}

// ── Shared card shell ─────────────────────────────────────────────────────────

type BadgeColor = 'yellow' | 'blue' | 'purple' | 'green';

const BADGE_CLASSES: Record<BadgeColor, string> = {
  yellow: 'bg-yellow-500/10 text-yellow-400',
  blue:   'bg-blue-500/10 text-blue-400',
  purple: 'bg-purple-500/10 text-purple-400',
  green:  'bg-green-500/10 text-green-400',
};

const CHAIN_NAMES: Record<number, string> = {
  1:     'Ethereum',
  10:    'Optimism',
  56:    'BNB Chain',
  137:   'Polygon',
  8453:  'Base',
  42161: 'Arbitrum One',
  43114: 'Avalanche',
};

function ActionCard({
  title,
  badge,
  badgeColor = 'blue',
  reason,
  detail,
  targetChainId,
  isLoading,
  isSuccess,
  isError,
  errorMessage,
  buttonLabel,
  onExecute,
  disabled,
}: {
  title: string;
  badge?: string;
  badgeColor?: BadgeColor;
  reason: string;
  detail?: string;
  targetChainId?: number;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage?: string;
  buttonLabel: string;
  onExecute: () => void;
  disabled?: boolean;
}) {
  const currentChainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const needsSwitch = targetChainId != null && !isSuccess && currentChainId !== targetChainId;
  const targetChainName = targetChainId ? (CHAIN_NAMES[targetChainId] ?? `Chain ${targetChainId}`) : '';

  return (
    <div className="my-1 rounded-xl border border-(--c-border2) bg-(--c-surface) p-4 text-sm">
      <div className="mb-2 flex items-center gap-2">
        {badge && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${BADGE_CLASSES[badgeColor]}`}>
            {badge}
          </span>
        )}
        <span className="font-semibold text-(--c-text1)">{title}</span>
      </div>

      <p className="mb-3 text-(--c-text2)">{reason}</p>

      {detail && (
        <pre className="mb-3 overflow-x-auto rounded-lg bg-(--c-bg) px-3 py-2 text-[11px] text-(--c-text3) whitespace-pre-wrap">
          {detail}
        </pre>
      )}

      {isError && errorMessage && (
        <p className="mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {errorMessage}
        </p>
      )}

      {needsSwitch ? (
        <button
          type="button"
          onClick={() => switchChain({ chainId: targetChainId! })}
          disabled={isSwitching}
          className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-400 active:scale-[0.98] disabled:opacity-60"
        >
          {isSwitching ? (
            <><span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />切换中…</>
          ) : (
            `切换到 ${targetChainName}`
          )}
        </button>
      ) : (
        <button
          className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition ${
            isSuccess
              ? 'cursor-default bg-green-600/30 text-green-400'
              : disabled
              ? 'cursor-not-allowed bg-(--c-surface2) text-(--c-text4) opacity-60'
              : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.98]'
          }`}
          disabled={disabled || isLoading}
          onClick={onExecute}
          type="button"
        >
          {isLoading && (
            <span className="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          {buttonLabel}
        </button>
      )}
    </div>
  );
}
