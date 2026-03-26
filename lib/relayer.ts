import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SOUNDARYA_CHAIN, SOUNDARYA_RPC_URL, SOUNDARYA_SCORE_ABI, SOUNDARYA_SCORE_ADDRESS } from "@/lib/contracts";
import { computeScanHash } from "@/lib/scans";

function getRelayerClient() {
  const privateKey = process.env.RELAYER_PRIVATE_KEY as `0x${string}` | undefined;
  if (!privateKey || !SOUNDARYA_RPC_URL) return null;

  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain: SOUNDARYA_CHAIN,
    transport: http(SOUNDARYA_RPC_URL),
  });
}

export async function attestScanOnchain(
  analysisId: string,
): Promise<string | null> {
  try {
    const walletClient = getRelayerClient();
    if (!walletClient) return null;

    const scanHash = computeScanHash(analysisId);
    const txHash = await walletClient.writeContract({
      address: SOUNDARYA_SCORE_ADDRESS,
      abi: SOUNDARYA_SCORE_ABI,
      functionName: "attestScan",
      args: [scanHash],
    });
    return txHash;
  } catch (err) {
    console.error("Relayer attestation failed:", err);
    return null;
  }
}

export async function persistRelayerTx(
  analysisId: string,
  txHash: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("analyses")
    .update({ relayer_tx_hash: txHash })
    .eq("id", analysisId);

  if (error) {
    console.error("Failed to persist relayer tx hash:", error);
  }
}
