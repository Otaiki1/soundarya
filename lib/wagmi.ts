import { http, createConfig } from "wagmi";
import { base } from "wagmi/chains";
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
              appName: "Uzoza",
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
              appName: "Uzoza",
              projectId: "soundarya",
          },
      );

export const config = createConfig({
    chains: [base],
    connectors,
    multiInjectedProviderDiscovery: false,
    transports: {
        [base.id]: http(SOUNDARYA_RPC_URL),
    },
    ssr: true,
});

declare module "wagmi" {
    interface Register {
        config: typeof config;
    }
}
