export type SwapMode = "exact-input" | "exact-output";

export type ChainRef = {
  chainId?: number;
  name?: string;
};

export type TokenRef = {
  chainId?: number;
  symbol?: string;
  address?: `0x${string}`;
  decimals?: number;
};

export type NaturalLanguageIntent = {
  sourceChain?: ChainRef;
  sourceToken?: TokenRef;
  destinationChain?: ChainRef;
  destinationToken?: TokenRef;
  amount?: string;
  amountSide?: "input" | "output";
  swapMode?: SwapMode;
  receiver?: `0x${string}`;
  userAddress?: `0x${string}`;
};

export type LifiQuoteSummary = {
  quoteId: string;
  validUntil: number;
  swapMode: SwapMode;
  input: {
    chainId: number;
    token: TokenRef;
    amount: string;
  };
  output: {
    chainId: number;
    token: TokenRef;
    amount: string;
    receiver: `0x${string}`;
  };
  raw: unknown;
};

export type WalletAction =
  | {
      type: "connect-wallet";
      reason: string;
    }
  | {
      type: "approve-erc20";
      chainId: number;
      token: `0x${string}`;
      spender: `0x${string}`;
      amount: string;
      reason: string;
    }
  | {
      type: "send-transaction";
      chainId: number;
      to: `0x${string}`;
      value?: string;
      data?: `0x${string}`;
      reason: string;
    }
  | {
      type: "sign-typed-data";
      chainId: number;
      typedData: unknown;
      reason: string;
    }
  | {
      type: "confirm-submit";
      quoteId?: string;
      orderPreview: unknown;
      reason: string;
    };

export type SubmittedOrder = {
  catalystOrderId?: string;
  onChainOrderId?: string;
  status?: string;
  quoteId?: string;
  createdAt: number;
  raw: unknown;
};
