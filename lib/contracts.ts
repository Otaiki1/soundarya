import SoundaryaScoreAbi from "./abi/SoundaryaScore.json";
import SoundaryaLeaderboardAbi from "./abi/SoundaryaLeaderboard.json";

export const SOUNDARYA_SCORE_ADDRESS = (process.env.NEXT_PUBLIC_SOUNDARYA_SCORE_ADDRESS || "0x63e42C4B53c210F548BE6144682d7fE4F8a79E81") as `0x${string}`;
export const SOUNDARYA_LEADERBOARD_ADDRESS = (process.env.NEXT_PUBLIC_SOUNDARYA_LEADERBOARD_ADDRESS || "0x111bB9CaFe15a6D3f6A7ae432CcD86f690BC6198") as `0x${string}`;

export const SOUNDARYA_SCORE_ABI = SoundaryaScoreAbi.abi;
export const SOUNDARYA_LEADERBOARD_ABI = SoundaryaLeaderboardAbi.abi;
