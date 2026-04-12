import { getAddress, isAddress } from "viem";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const FREE_ANALYSES_PER_MONTH = 3;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
  resetsAt?: string;
}

export function getUtcMonthWindow(): {
  monthStartIso: string;
  nextMonthStartIso: string;
  retryAfterMs: number;
} {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const monthStart = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  const nextMonthStart = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0, 0));
  return {
    monthStartIso: monthStart.toISOString(),
    nextMonthStartIso: nextMonthStart.toISOString(),
    retryAfterMs: Math.max(0, nextMonthStart.getTime() - now.getTime()),
  };
}

/**
 * Stable identity for free-tier quota: logged-in user > connected wallet > browser session.
 */
export function buildFreeQuotaRawKey(params: {
  userId?: string | null;
  walletAddress?: string | null;
  sessionId: string;
}): string {
  if (params.userId) {
    return `user:${params.userId}`;
  }
  const trimmed = params.walletAddress?.trim();
  if (trimmed && isAddress(trimmed)) {
    return `wallet:${getAddress(trimmed).toLowerCase()}`;
  }
  return `session:${params.sessionId}`;
}

export async function hashFreeQuotaKey(raw: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const salt = process.env.CRON_SECRET || "soundarya-default-salt";
    const data = encoder.encode(`free-quota:v1:${raw}:${salt}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex.slice(0, 32);
  } catch (error) {
    console.error("[Rate Limit] Error hashing free quota key:", error);
    return btoa(raw).slice(0, 32);
  }
}

/**
 * Free tier: up to FREE_ANALYSES_PER_MONTH analyses per calendar month (UTC)
 * per quota key (wallet, session, or auth user).
 */
export async function checkMonthlyFreeQuota(
  freeQuotaKeyHash: string,
): Promise<RateLimitResult> {
  const { monthStartIso, nextMonthStartIso, retryAfterMs } = getUtcMonthWindow();

  try {
    const { count, error } = await supabaseAdmin
      .from("analyses")
      .select("id", { count: "exact", head: true })
      .eq("free_quota_key", freeQuotaKeyHash)
      .gte("created_at", monthStartIso);

    if (error) {
      console.error("[Rate Limit] Error checking monthly free quota:", error);
      return {
        allowed: true,
        remaining: FREE_ANALYSES_PER_MONTH - 1,
      };
    }

    const used = count ?? 0;
    const remaining = Math.max(0, FREE_ANALYSES_PER_MONTH - used);

    if (remaining === 0) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter: retryAfterMs,
        resetsAt: nextMonthStartIso,
      };
    }

    return {
      allowed: true,
      remaining: remaining - 1,
      resetsAt: nextMonthStartIso,
    };
  } catch (error) {
    console.error("[Rate Limit] Error checking monthly free quota:", error);
    return {
      allowed: true,
      remaining: FREE_ANALYSES_PER_MONTH - 1,
    };
  }
}

export async function hashIP(ip: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const salt = process.env.CRON_SECRET || "soundarya-default-salt";
    const data = encoder.encode(ip + salt);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex.slice(0, 16);
  } catch (error) {
    console.error("[Rate Limit] Error hashing IP:", error);
    return btoa(ip).slice(0, 16);
  }
}
