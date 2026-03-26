let cachedPrice: { value: number; expiresAt: number } | null = null;

export async function getEthPriceUsd(): Promise<number> {
  const now = Date.now();
  if (cachedPrice && cachedPrice.expiresAt > now) {
    return cachedPrice.value;
  }

  const response = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
    {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch ETH price: ${response.status}`);
  }

  const data = (await response.json()) as {
    ethereum?: { usd?: number };
  };
  const price = data.ethereum?.usd;

  if (typeof price !== "number" || Number.isNaN(price)) {
    throw new Error("Invalid ETH price payload");
  }

  cachedPrice = {
    value: price,
    expiresAt: now + 60_000,
  };

  return price;
}
