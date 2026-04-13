import { http, createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { Attribution } from "ox/erc8021";
import {
    injectedWallet,
    walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { SOUNDARYA_RPC_URL } from "@/lib/contracts";

const DATA_SUFFIX = Attribution.toDataSuffix({
    codes: ["bc_k2pvdaf9"],
});

const walletConnectProjectId =
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

const globalForWagmi = globalThis as typeof globalThis & {
    __soundaryaConnectors?: ReturnType<typeof connectorsForWallets>;
    __soundaryaWagmiConfig?: ReturnType<typeof createConfig>;
};

function buildConnectors() {
    return walletConnectProjectId
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
                  projectId: "soundarya-dev",
              },
          );
}

function buildConfig() {
    return createConfig({
        chains: [base],
        connectors,
        multiInjectedProviderDiscovery: false,
        transports: {
            [base.id]: http(SOUNDARYA_RPC_URL),
        },
        dataSuffix: DATA_SUFFIX,
        ssr: true,
    });
}

const connectors =
    globalForWagmi.__soundaryaConnectors ?? buildConnectors();
if (process.env.NODE_ENV !== "production") {
    globalForWagmi.__soundaryaConnectors = connectors;
}

export const config =
    globalForWagmi.__soundaryaWagmiConfig ?? buildConfig();
if (process.env.NODE_ENV !== "production") {
    globalForWagmi.__soundaryaWagmiConfig = config;
}

declare module "wagmi" {
    interface Register {
        config: typeof config;
    }
}
