import { formatUnits } from "viem";
import { USDT_DECIMALS } from "./chains";

export function usdt(value: bigint | undefined, opts: { precise?: boolean } = {}) {
  if (value === undefined) return "—";
  const n = Number(formatUnits(value, USDT_DECIMALS));
  const digits = opts.precise || (n > 0 && n < 1) ? 3 : 2;
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: digits });
}

export function compact(n: number | bigint) {
  return Number(n).toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 });
}

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function timeAgo(seconds: number | bigint) {
  const diff = Math.max(0, Date.now() / 1000 - Number(seconds));
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(Number(seconds) * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function joinedOn(seconds: number | bigint) {
  return new Date(Number(seconds) * 1000).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}
