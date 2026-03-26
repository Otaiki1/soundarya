import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { getOrCreateSessionId } from "@/lib/session";

export interface ScoreHistoryResponse {
  analyses: any[];
  bestScore: number;
  totalScans: number;
  improvement: number;
}

export function useScoreHistory() {
  const { address } = useAccount();
  const sessionId = typeof window === "undefined" ? "" : getOrCreateSessionId();

  return useQuery<ScoreHistoryResponse>({
    queryKey: ["scoreHistory", address, sessionId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (address) params.set("walletAddress", address);
      if (sessionId) params.set("sessionId", sessionId);

      const response = await fetch(`/api/score-history?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load score history");
      }
      return response.json();
    },
  });
}
