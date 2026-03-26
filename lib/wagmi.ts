import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
    injectedWallet,
    walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { SOUNDARYA_RPC_URL } from "@/lib/contracts";

const walletConnectProjectId =
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

const connectors = walletConnectProjectId
    ? connectorsForWallets(
          [
              {
                  groupName: "Recommended",
                  wallets: [
                      injectedWallet,
                      walletConnectWallet,
                  ],
              },
          ],
          {
              appName: "Soundarya",
              projectId: walletConnectProjectId,
          },
      )
    : connectorsForWallets(
          [
              {
                  groupName: "Recommended",
                  wallets: [injectedWallet],
              },
          ],
          {
              appName: "Soundarya",
              projectId: "soundarya",
          },
      );

export const config = createConfig({
    chains: [base, baseSepolia],
    connectors,
    multiInjectedProviderDiscovery: false,
    transports: {
        [base.id]: http(SOUNDARYA_RPC_URL),
        [baseSepolia.id]: http(SOUNDARYA_RPC_URL),
    },
    ssr: true,
});

declare module "wagmi" {
    interface Register {
        config: typeof config;
    }
}
