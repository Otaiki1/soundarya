import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
    createPublicClient,
    encodeAbiParameters,
    formatEther,
    http,
    keccak256,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
    SOUNDARYA_CHAIN,
    SOUNDARYA_CHAIN_ID,
    SOUNDARYA_RPC_URL,
    SOUNDARYA_SCORE_ABI,
    SOUNDARYA_SCORE_ADDRESS,
} from "@/lib/contracts";
import { analysisIdToContractUint } from "@/lib/scans";
import { supabaseAdmin } from "@/lib/supabase/admin";

const publicClient = createPublicClient({
    chain: SOUNDARYA_CHAIN,
    transport: http(SOUNDARYA_RPC_URL),
});

function getMinterAccount() {
    const privateKey = process.env.MINTER_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error("MINTER_PRIVATE_KEY is not configured");
    }

    const normalized = privateKey.startsWith("0x")
        ? privateKey
        : `0x${privateKey}`;

    return privateKeyToAccount(normalized as `0x${string}`);
}

function makeNonce() {
    return BigInt(`0x${randomBytes(16).toString("hex")}`);
}

export async function POST(request: NextRequest) {
    try {
        const { analysisId, walletAddress } = await request.json();

        if (!analysisId || !walletAddress) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 },
            );
        }

        // Fetch analysis data
        const { data: analysisData, error: fetchError } = await supabaseAdmin
            .from("analyses")
            .select("*")
            .eq("id", analysisId)
            .single();

        if (fetchError || !analysisData) {
            return NextResponse.json(
                { error: "Analysis not found" },
                { status: 404 },
            );
        }

        const minterAccount = getMinterAccount();
        const numericAnalysisId = analysisIdToContractUint(analysisId);
        const nonce = makeNonce();
        const normalizedWallet = walletAddress as `0x${string}`;

        const [onchainMinterSigner, isSubscribedResult, mintPriceWeiResult, alreadyMintedResult] =
            await Promise.all([
                publicClient.readContract({
                    address: SOUNDARYA_SCORE_ADDRESS,
                    abi: SOUNDARYA_SCORE_ABI,
                    functionName: "minterSigner",
                }),
                publicClient.readContract({
                    address: SOUNDARYA_SCORE_ADDRESS,
                    abi: SOUNDARYA_SCORE_ABI,
                    functionName: "isSubscribed",
                    args: [normalizedWallet],
                }),
                publicClient.readContract({
                    address: SOUNDARYA_SCORE_ADDRESS,
                    abi: SOUNDARYA_SCORE_ABI,
                    functionName: "mintPrice",
                }),
                publicClient.readContract({
                    address: SOUNDARYA_SCORE_ADDRESS,
                    abi: SOUNDARYA_SCORE_ABI,
                    functionName: "analysisIdMinted",
                    args: [numericAnalysisId],
                }),
            ]);

        const isSubscribed = Boolean(isSubscribedResult);
        const mintPriceWei =
            typeof mintPriceWeiResult === "bigint"
                ? mintPriceWeiResult
                : BigInt(0);
        const alreadyMinted = Boolean(alreadyMintedResult);

        if (
            String(onchainMinterSigner).toLowerCase() !==
            minterAccount.address.toLowerCase()
        ) {
            return NextResponse.json(
                {
                    error: "MINTER_PRIVATE_KEY does not match contract minterSigner",
                    expected: onchainMinterSigner,
                    actual: minterAccount.address,
                },
                { status: 500 },
            );
        }

        if (alreadyMinted) {
            return NextResponse.json(
                { error: "This analysis has already been minted" },
                { status: 409 },
            );
        }

        const scoreData = {
            analysisId: numericAnalysisId.toString(),
            nonce: nonce.toString(),
            to: normalizedWallet,
            score: Math.floor(analysisData.overall_score * 10).toString(),
            dim0: Math.floor(analysisData.symmetry_score).toString(),
            dim1: Math.floor(analysisData.proportionality_score).toString(),
            dim2: Math.floor(analysisData.bone_structure_score).toString(),
            dim3: Math.floor(analysisData.harmony_score).toString(),
            dim4: Math.floor(analysisData.skin_score).toString(),
            dim5: Math.floor(analysisData.dimorphism_score).toString(),
            dim6: Math.floor(analysisData.percentile).toString(),
        };

        const structHash = keccak256(
            encodeAbiParameters(
                [
                    { name: "analysisId", type: "uint256" },
                    { name: "nonce", type: "uint256" },
                    { name: "to", type: "address" },
                    { name: "score", type: "uint256" },
                    { name: "dim0", type: "uint256" },
                    { name: "dim1", type: "uint256" },
                    { name: "dim2", type: "uint256" },
                    { name: "dim3", type: "uint256" },
                    { name: "dim4", type: "uint256" },
                    { name: "dim5", type: "uint256" },
                    { name: "dim6", type: "uint256" },
                    { name: "chainId", type: "uint256" },
                    { name: "contract", type: "address" },
                ],
                [
                    numericAnalysisId,
                    nonce,
                    normalizedWallet,
                    BigInt(scoreData.score),
                    BigInt(scoreData.dim0),
                    BigInt(scoreData.dim1),
                    BigInt(scoreData.dim2),
                    BigInt(scoreData.dim3),
                    BigInt(scoreData.dim4),
                    BigInt(scoreData.dim5),
                    BigInt(scoreData.dim6),
                    BigInt(SOUNDARYA_CHAIN_ID),
                    SOUNDARYA_SCORE_ADDRESS,
                ],
            ),
        );

        const signature = await minterAccount.signMessage({
            message: { raw: structHash },
        });

        const mintPrice = isSubscribed ? "0" : formatEther(mintPriceWei);

        return NextResponse.json({
            signature,
            scoreData,
            mintPrice,
        });
    } catch (error) {
        console.error("Mint signature error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
