import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

const walletConnectProjectId =
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

const connectors = [
    coinbaseWallet({ appName: "Soundarya" }),
    injected(),
    ...(walletConnectProjectId
        ? [walletConnect({ projectId: walletConnectProjectId })]
        : []),
];

export const config = createConfig({
    chains: [base, baseSepolia],
    connectors,
    transports: {
        [base.id]: http(),
        [baseSepolia.id]: http(),
    },
    ssr: true,
});

declare module "wagmi" {
    interface Register {
        config: typeof config;
    }
}
