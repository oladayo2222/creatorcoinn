// Mirrors the constants in contracts/contracts/CreatorCoin.sol.
export const BASE_PRICE = 100_000n; // 0.10 USDT
export const PRICE_STEP = 50_000n; // +0.05 USDT per coin
export const CREATOR_FEE_PCT = 5;
export const PROTOCOL_FEE_PCT = 2;
export const MAX_TRADE = 50;

export function priceAt(supply: bigint | number) {
  return BASE_PRICE + PRICE_STEP * BigInt(supply);
}
