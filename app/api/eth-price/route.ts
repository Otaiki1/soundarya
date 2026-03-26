import { NextResponse } from "next/server";
import { getEthPriceUsd } from "@/lib/ethPrice";

export async function GET() {
  try {
    const priceUsd = await getEthPriceUsd();
    const response = NextResponse.json({
      symbol: "ETH",
      currency: "USD",
      priceUsd,
      updatedAt: new Date().toISOString(),
    });
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return response;
  } catch (error) {
    console.error("ETH price route error:", error);
    return NextResponse.json(
      { error: "Unable to fetch ETH price" },
      { status: 500 },
    );
  }
}
