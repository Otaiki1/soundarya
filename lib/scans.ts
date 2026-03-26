import { encodePacked, keccak256, type Hex } from "viem";

export interface StoredScanRecord {
  analysisId: string;
  scanHash: Hex;
  timestamp: number;
}

export const STORED_SCANS_KEY = "soundarya_scans";

export function computeScanHash(analysisId: string): Hex {
  return keccak256(encodePacked(["string"], [analysisId]));
}

export function analysisIdToContractUint(analysisId: string): bigint {
  return BigInt(`0x${analysisId.replace(/-/g, "")}`);
}

export function storeScanRecord(analysisId: string): StoredScanRecord | null {
  if (typeof window === "undefined") return null;

  const scanHash = computeScanHash(analysisId);
  const existing = getStoredScans().filter(
    (scan) => scan.analysisId !== analysisId,
  );
  const record = { analysisId, scanHash, timestamp: Date.now() };
  existing.push(record);
  localStorage.setItem(STORED_SCANS_KEY, JSON.stringify(existing));
  return record;
}

export function getStoredScans(): StoredScanRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORED_SCANS_KEY);
    const parsed = raw ? (JSON.parse(raw) as StoredScanRecord[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function removeStoredScans(scanHashes: Hex[]) {
  if (typeof window === "undefined") return;
  const hashSet = new Set(scanHashes);
  const remaining = getStoredScans().filter((scan) => !hashSet.has(scan.scanHash));
  localStorage.setItem(STORED_SCANS_KEY, JSON.stringify(remaining));
}
