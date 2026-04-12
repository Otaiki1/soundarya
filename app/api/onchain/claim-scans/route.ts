import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  try {
    return NextResponse.json(
      {
        linkedCount: 0,
        claimedScanHashes: [],
        maintenance: true,
        message:
          "Scan claiming is temporarily disabled until a signed ownership proof is implemented.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Claim scans route error:", error);
    return NextResponse.json(
      { error: "Unable to claim scans" },
      { status: 500 },
    );
  }
}
