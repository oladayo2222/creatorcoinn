"use client";

import Link from "next/link";
import { useState } from "react";
import { zeroAddress } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { Avatar } from "@/components/Avatar";
import { HoldersTab } from "@/components/HoldersTab";
import { PostsTab } from "@/components/PostsTab";
import { PriceBars } from "@/components/PriceBars";
import { RoomTab } from "@/components/RoomTab";
import { TradeFeed, type Trade } from "@/components/TradeFeed";
import { TradePanel } from "@/components/TradePanel";
import { ArrowUpRight, Unlock } from "@/components/icons";
import { addressUrl } from "@/lib/chains";
import { coin, isConfigured, type Creator } from "@/lib/contract";
import { priceAt, PRICE_STEP } from "@/lib/curve";
import { joinedOn, shortAddress, usdt } from "@/lib/format";

type Tab = "posts" | "room" | "holders" | "activity";

export function CreatorView({ handle }: { handle: string }) {
  const { address } = useAccount();
  const [tab, setTab] = useState<Tab>("posts");

  const { data, isLoading } = useReadContract({
    ...coin,
    functionName: "creatorByHandle",
    args: [handle],
    query: { enabled: isConfigured, refetchInterval: 10_000 },
  });
  const creator = data && data.account !== zeroAddress ? (data as Creator) : undefined;

  const { data: held = 0n } = useReadContract({
    ...coin,
    functionName: "balanceOf",
    args: creator && address ? [creator.account, address] : undefined,
    query: { enabled: Boolean(creator && address) },
  });

  const { data: trades } = useReadContract({
    ...coin,
    functionName: "getCreatorTrades",
    args: creator ? [creator.account, 30n] : undefined,
    query: { enabled: Boolean(creator), refetchInterval: 10_000 },
  });

  if (isConfigured && isLoading) return <PageSkeleton />;

  if (!creator) {
    return (
      <div className="mx-auto max-w-xl px-4 py-28 text-center">
        <p className="eyebrow">Not found</p>
        <h1 className="display mt-4 text-4xl font-semibold">No coin at @{handle}</h1>
        <p className="mt-4 text-muted">This handle hasn&apos;t been claimed. If it&apos;s yours, it could be.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/launch" className="pill pill-ink">Claim @{handle}</Link>
          <Link href="/#creators" className="pill pill-line">Browse creators</Link>
        </div>
      </div>
    );
  }

  const isOwner = Boolean(address && address.toLowerCase() === creator.account.toLowerCase());
  const access = isOwner || held >= BigInt(creator.unlockAt);
  const price = priceAt(creator.supply);
  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "posts", label: "Posts", count: creator.postCount },
    { key: "room", label: "Holder room", count: creator.messageCount },
    { key: "holders", label: "Holders", count: creator.holders },
    { key: "activity", label: "Activity" },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-10 sm:px-6 lg:pt-14">
      {/* Profile */}
      <section className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <Avatar name={creator.name} seed={creator.account} src={creator.avatarUrl} size={112} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="font-bold text-ink">@{creator.handle}</span>
            <span>Joined {joinedOn(creator.joinedAt)}</span>
            <a href={addressUrl(creator.account)} target="_blank" rel="noreferrer" className="tnum inline-flex items-center gap-1 hover:text-plum">
              {shortAddress(creator.account)} <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <h1 className="display mt-2 break-words text-4xl font-semibold sm:text-5xl">{creator.name}</h1>
          {creator.bio && <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink-soft">{creator.bio}</p>}
        </div>
        {access && (
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-ink px-4 py-2 text-sm font-bold text-sun sm:self-end">
            <Unlock /> {isOwner ? "Your coin" : "Unlocked"}
          </span>
        )}
      </section>

      {/* Stats */}
      <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-4">
        <Stat label="Next coin" value={`${usdt(price)} USDT`} />
        <Stat label="Holders" value={creator.holders.toString()} />
        <Stat label="Coins out" value={creator.supply.toString()} />
        <Stat label="Creator earned" value={`${usdt(creator.feesEarned)} USDT`} />
      </dl>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="order-2 min-w-0 lg:order-1">
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-line" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
                  tab === t.key ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {t.label}
                {t.count !== undefined && <span className="tnum rounded-full bg-wash px-2 py-0.5 text-xs">{t.count}</span>}
              </button>
            ))}
          </div>

          <div className="pt-6">
            {tab === "posts" && <PostsTab creator={creator} access={access} isOwner={isOwner} held={held} />}
            {tab === "room" && <RoomTab creator={creator} access={access} held={held} />}
            {tab === "holders" && <HoldersTab creator={creator} me={address} />}
            {tab === "activity" && (
              <div className="rounded-card border border-line bg-card px-5">
                <TradeFeed trades={(trades ?? []) as readonly Trade[]} empty="No trades yet. The first buyer gets the lowest price." />
              </div>
            )}
          </div>
        </div>

        <aside className="order-1 space-y-4 lg:sticky lg:top-24 lg:order-2">
          <TradePanel creator={creator} held={held} />
          <div className="rounded-card border border-line bg-card p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-bold">Price curve</p>
              <p className="tnum text-xs text-muted">+{usdt(PRICE_STEP)} USDT per coin</p>
            </div>
            <PriceBars supply={creator.supply} className="mt-4" />
            <p className="mt-3 text-xs text-muted">
              Dark bars are coins already held. The orange bar is the next coin at {usdt(price)} USDT.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card px-5 py-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="tnum mt-0.5 font-display text-lg font-semibold">{value}</dd>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-14 sm:px-6">
      <div className="flex items-end gap-6">
        <div className="h-28 w-28 animate-pulse rounded-[1.5rem] bg-wash" />
        <div className="space-y-3">
          <div className="h-4 w-40 animate-pulse rounded bg-wash" />
          <div className="h-10 w-72 animate-pulse rounded bg-wash" />
        </div>
      </div>
      <div className="mt-10 h-20 animate-pulse rounded-card bg-wash" />
    </div>
  );
}
