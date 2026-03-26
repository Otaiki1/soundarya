import { base, baseSepolia } from "viem/chains";
import SoundaryaScoreAbi from "./abi/SoundaryaScore.json";
import SoundaryaLeaderboardAbi from "./abi/SoundaryaLeaderboard.json";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "8453");

export const SOUNDARYA_CHAIN = chainId === 84532 ? baseSepolia : base;
export const SOUNDARYA_CHAIN_ID = SOUNDARYA_CHAIN.id;
export const SOUNDARYA_RPC_URL =
  process.env.BASE_RPC_URL || process.env.NEXT_PUBLIC_BASE_RPC_URL;

export const SOUNDARYA_SCORE_ADDRESS = (
  process.env.NEXT_PUBLIC_SCORE_NFT_ADDRESS ||
  process.env.NEXT_PUBLIC_SOUNDARYA_NFT_ADDRESS ||
  "0x00777bf52db73cc352c25560448f0b727dbd0176"
) as `0x${string}`;

export const SOUNDARYA_LEADERBOARD_ADDRESS = (
  process.env.NEXT_PUBLIC_LEADERBOARD_ADDRESS ||
  process.env.NEXT_PUBLIC_SOUNDARYA_LEADERBOARD_ADDRESS ||
  "0x80c9db6a454f91a49e3b1ceb70a7f83e10670323"
) as `0x${string}`;

export const SOUNDARYA_SCORE_ABI = SoundaryaScoreAbi.abi;
export const SOUNDARYA_LEADERBOARD_ABI = SoundaryaLeaderboardAbi.abi;
