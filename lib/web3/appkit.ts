import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import {
  mainnet,
  base,
  polygon,
  arbitrum,
  optimism,
  bsc,
} from "@reown/appkit/networks";

export const projectId =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ||
  "b56e18d47c72ab683b10814fe9495694"; // fallback: public localhost-only test key

export const networks = [
  mainnet,
  base,
  arbitrum,
  optimism,
  polygon,
  bsc,
];

export const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  networks,
  projectId,
});

export const appKitMetadata = {
  name: "LI.FI Intent Agent",
  description: "Cross-chain swap agent powered by LI.FI",
  url:
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000",
  icons: [],
};
