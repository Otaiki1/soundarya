import { base } from "wagmi/chains";
import { useAccount, useChainId, useSwitchChain } from "wagmi";

const BASE_MAINNET_ERROR = "Please switch your wallet to Base Mainnet to continue.";

export function useBaseMainnetGuard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const isOnBaseMainnet = chainId === base.id;

  const ensureBaseMainnet = async () => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    if (isOnBaseMainnet) {
      return;
    }

    if (!switchChainAsync) {
      throw new Error(BASE_MAINNET_ERROR);
    }

    try {
      await switchChainAsync({ chainId: base.id });
    } catch (error) {
      throw error instanceof Error ? error : new Error(BASE_MAINNET_ERROR);
    }
  };

  return {
    requiredChainId: base.id,
    requiredChainName: "Base Mainnet",
    isOnBaseMainnet,
    ensureBaseMainnet,
  };
}
