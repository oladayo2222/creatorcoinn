"use client";

import Link from "next/link";
import { addressUrl } from "@/lib/chains";
import type { Creator } from "@/lib/contract";
import { shortAddress, timeAgo, usdt } from "@/lib/format";

export type Trade = {
  trader: `0x${string}`;
  creator: `0x${string}`;
  isBuy: boolean;
  amount: number;
  supplyAfter: number;
  at: bigint;
  value: bigint;
};

export function TradeFeed({
  trades,
  creators,
  empty = "No trades yet.",
}: {
  trades: readonly Trade[];
  creators?: readonly Creator[];
  empty?: string;
}) {
  const byAccount = new Map(creators?.map((c) => [c.account.toLowerCase(), c]));
  const nameOf = (addr: string) => byAccount.get(addr.toLowerCase());

  if (!trades.length) return <p className="py-8 text-center text-sm text-muted">{empty}</p>;

  return (
    <ul className="divide-y divide-line">
      {trades.map((t, i) => {
        const creator = nameOf(t.creator);
        const trader = nameOf(t.trader);
        return (
          <li key={`${t.at}-${i}`} className="flex items-start gap-3 py-3.5 text-sm">
            <span
              className={`mt-1 inline-grid h-6 min-w-11 place-items-center rounded-full px-2 text-[11px] font-extrabold uppercase tracking-wide ${
                t.isBuy ? "bg-plum-soft text-plum-deep" : "bg-coral-soft text-ink"
              }`}
            >
              {t.isBuy ? "Buy" : "Sell"}
            </span>
            <p className="min-w-0 flex-1 leading-relaxed">
              <a href={addressUrl(t.trader)} target="_blank" rel="noreferrer" className="font-bold hover:text-plum">
                {trader ? `@${trader.handle}` : shortAddress(t.trader)}
              </a>{" "}
              {t.isBuy ? "bought" : "sold"} {t.amount} {t.amount === 1 ? "coin" : "coins"}
              {creators && creator && (
                <>
                  {" "}of{" "}
                  <Link href={`/c/${creator.handle}`} className="font-bold hover:text-plum">
                    @{creator.handle}
                  </Link>
                </>
              )}
              <span className="block text-muted">
                <span className="tnum">{usdt(t.value)} USDT</span> · {timeAgo(t.at)}
              </span>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
