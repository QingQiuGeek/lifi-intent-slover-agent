'use client';

import { createAppKit } from "@reown/appkit/react";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, cookieToInitialState } from "wagmi";
import { type ReactNode } from "react";
import { ThemeProvider } from 'next-themes';
import { projectId, networks, wagmiAdapter, appKitMetadata } from "@/lib/web3/appkit";

// createAppKit must be called at module scope — exactly once
createAppKit({
  adapters: [wagmiAdapter],
  networks: networks as unknown as [AppKitNetwork, ...AppKitNetwork[]],
  projectId,
  metadata: appKitMetadata,
  features: {
    analytics: false,
    email: false,
    socials: [],
  },
  themeMode: "dark",
});

const queryClient = new QueryClient();

export function Web3Providers({
  children,
  cookie,
}: {
  children: ReactNode;
  cookie?: string | null;
}) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig, cookie);

  return (
    <ThemeProvider attribute='class' defaultTheme='dark' disableTransitionOnChange={false}>
      <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
