import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const walletConnectProjectId =
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

const connectors = [
    injected({
        shimDisconnect: true,
        unstable_shimAsyncInject: 2_000,
    }),
    ...(walletConnectProjectId
        ? [walletConnect({ projectId: walletConnectProjectId })]
        : []),
];

export const config = createConfig({
    chains: [base, baseSepolia],
    connectors,
    multiInjectedProviderDiscovery: false,
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
