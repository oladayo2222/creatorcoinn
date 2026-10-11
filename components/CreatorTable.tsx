"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Creator } from "@/lib/contract";
import { priceAt } from "@/lib/curve";
import { compact, usdt } from "@/lib/format";
import { Avatar } from "./Avatar";
import { ArrowRight } from "./icons";

const SORTS = {
  trending: { label: "Most traded", fn: (a: Creator, b: Creator) => Number(b.volume - a.volume) },
  holders: { label: "Most holders", fn: (a: Creator, b: Creator) => b.holders - a.holders },
  newest: { label: "Newest", fn: (a: Creator, b: Creator) => Number(b.joinedAt - a.joinedAt) },
} as const;

type SortKey = keyof typeof SORTS;

export function CreatorTable({ creators, loading }: { creators: readonly Creator[]; loading: boolean }) {
  const [sort, setSort] = useState<SortKey>("trending");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...creators]
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.handle.includes(q))
      .sort(SORTS[sort].fn);
  }, [creators, sort, query]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-full border border-line bg-card p-1" role="tablist">
          {(Object.keys(SORTS) as SortKey[]).map((key) => (
            <button
              key={key}
              role="tab"
              aria-selected={sort === key}
              onClick={() => setSort(key)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors ${
                sort === key ? "bg-ink text-white" : "text-muted hover:text-ink"
              }`}
            >
              {SORTS[key].label}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or @handle"
          className="field h-11 rounded-full sm:max-w-[260px]"
          aria-label="Search creators"
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-card border border-line bg-card">
        <div className="hidden grid-cols-[2.2fr_1fr_1fr_1fr_1fr_auto] gap-4 border-b border-line px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted md:grid">
          <span>Creator</span>
          <span className="text-right">Price</span>
          <span className="text-right">Since launch</span>
          <span className="text-right">Holders</span>
          <span className="text-right">Volume</span>
          <span className="w-8" />
        </div>

        {loading && <SkeletonRows />}

        {!loading && rows.length === 0 && (
          <div className="px-5 py-14 text-center">
            <p className="font-display text-lg font-semibold">{query ? "No one by that name yet" : "No coins launched yet"}</p>
            <p className="mt-1 text-sm text-muted">
              {query ? "Try another handle." : "Be the first creator on the curve."}
            </p>
            {!query && (
              <Link href="/launch" className="pill pill-ink mt-5">
                Launch your coin
              </Link>
            )}
          </div>
        )}

        <ul className="divide-y divide-line">
          {rows.map((c, i) => {
            const price = priceAt(c.supply);
            const change = ((Number(price) - Number(priceAt(1))) / Number(priceAt(1))) * 100;
            return (
              <li key={c.account}>
                <Link
                  href={`/c/${c.handle}`}
                  className="group grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-paper md:grid-cols-[2.2fr_1fr_1fr_1fr_1fr_auto]"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span className="tnum hidden w-5 text-sm font-bold text-muted sm:block">{i + 1}</span>
                    <Avatar name={c.name} seed={c.account} src={c.avatarUrl} size={44} />
                    <div className="min-w-0">
                      <p className="truncate font-bold">{c.name}</p>
                      <p className="truncate text-sm text-muted">
                        @{c.handle} · unlock at {c.unlockAt}
                      </p>
                    </div>
                  </div>
                  <div className="tnum text-right md:contents">
                    <span className="block font-bold md:text-right">{usdt(price)} USDT</span>
                    <span className={`block text-sm font-bold md:text-right ${change > 0 ? "text-up" : "text-muted"}`}>
                      {change > 0 ? `+${change.toFixed(0)}%` : "—"}
                    </span>
                    <span className="hidden text-right font-semibold md:block">{c.holders}</span>
                    <span className="hidden text-right font-semibold md:block">{compact(Number(c.volume) / 1e6)} USDT</span>
                  </div>
                  <span className="hidden h-8 w-8 place-items-center rounded-full border border-line transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-white md:grid">
                    <ArrowRight />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function SkeletonRows() {
  return (
    <ul className="divide-y divide-line">
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex items-center gap-3.5 px-5 py-4">
          <div className="h-11 w-11 animate-pulse rounded-xl bg-wash" />
          <div className="space-y-2">
            <div className="h-3.5 w-36 animate-pulse rounded bg-wash" />
            <div className="h-3 w-24 animate-pulse rounded bg-wash" />
          </div>
        </li>
      ))}
    </ul>
  );
}
