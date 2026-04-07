import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  try {
    return NextResponse.json(
      {
        error:
          "Scan claiming is temporarily disabled until a signed ownership proof is implemented.",
      },
      { status: 501 },
    );
  } catch (error) {
    console.error("Claim scans route error:", error);
    return NextResponse.json(
      { error: "Unable to claim scans" },
      { status: 500 },
    );
  }
}
