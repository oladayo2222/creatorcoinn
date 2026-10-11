"use client";

import Link from "next/link";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { Avatar } from "@/components/Avatar";
import { CreatorTable } from "@/components/CreatorTable";
import { FeaturedCoin } from "@/components/FeaturedCoin";
import { TradeFeed, type Trade } from "@/components/TradeFeed";
import { useCreators } from "@/components/useCreators";
import { ArrowRight } from "@/components/icons";
import { coin, isConfigured } from "@/lib/contract";
import { BASE_PRICE, CREATOR_FEE_PCT, PRICE_STEP, PROTOCOL_FEE_PCT } from "@/lib/curve";
import { compact, usdt } from "@/lib/format";

export default function Home() {
  const { address } = useAccount();
  const { creators, isLoading } = useCreators();

  const { data: stats } = useReadContracts({
    contracts: [
      { ...coin, functionName: "creatorCount" },
      { ...coin, functionName: "tradeCount" },
      { ...coin, functionName: "totalVolume" },
    ],
    query: { enabled: isConfigured, refetchInterval: 15_000 },
  });

  const { data: trades } = useReadContract({
    ...coin,
    functionName: "getRecentTrades",
    args: [8n],
    query: { enabled: isConfigured, refetchInterval: 10_000 },
  });

  const { data: portfolio } = useReadContract({
    ...coin,
    functionName: "getPortfolio",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) && isConfigured },
  });

  const featured = [...creators].sort((a, b) => b.supply - a.supply)[0];
  const holdings = portfolio ? portfolio[0].map((c, i) => ({ creator: c, balance: portfolio[1][i] })) : [];
  const [creatorCount, tradeCount, totalVolume] = stats?.map((s) => s.result as bigint | undefined) ?? [];

  return (
    <>
      {!isConfigured && (
        <div className="border-b border-line bg-sun-soft px-4 py-3 text-center text-sm font-semibold">
          Set <code className="rounded bg-card px-1.5">NEXT_PUBLIC_CREATORCOIN_ADDRESS</code> to connect this app to the contract.
        </div>
      )}

      {/* Hero */}
      <section className="wash relative overflow-hidden">
        <div className="mx-auto grid max-w-[1200px] grid-cols-[minmax(0,1fr)] items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:pb-28 lg:pt-20">
          <div>
            <p className="eyebrow">Creator coins on BOT Chain · priced in USDT</p>
            <h1 className="display mt-6 text-[2.6rem] font-semibold uppercase sm:text-6xl lg:text-[4.6rem]">
              Hold the
              <br />
              creators
              <br />
              <span className="text-plum">you back.</span>
            </h1>
            <p className="mt-7 max-w-[34rem] text-lg leading-relaxed text-ink-soft">
              Every creator gets their own coin. Get in early, unlock the posts they only share with holders, and take a
              seat in a room only holders can write in.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="#creators" className="pill pill-ink">
                Explore creators <ArrowRight />
              </Link>
              <Link href="/launch" className="pill pill-line">
                Launch your coin
              </Link>
            </div>

            <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4">
              <Stat label="Creators" value={creatorCount !== undefined ? compact(creatorCount) : "—"} />
              <Stat label="Trades" value={tradeCount !== undefined ? compact(tradeCount) : "—"} />
              <Stat label="Volume" value={totalVolume !== undefined ? `${usdt(totalVolume)} USDT` : "—"} />
            </dl>
          </div>

          <FeaturedCoin creator={featured} />
        </div>
      </section>

      {/* Your coins */}
      {holdings.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-4 pt-14 sm:px-6">
          <h2 className="eyebrow">Your coins</h2>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {holdings.map(({ creator, balance }) => {
              const unlocked = balance >= BigInt(creator.unlockAt) || creator.account === address;
              return (
                <Link
                  key={creator.account}
                  href={`/c/${creator.handle}`}
                  className="flex min-w-[240px] items-center gap-3 rounded-card border border-line bg-card p-3.5 pr-5 transition-colors hover:border-ink"
                >
                  <Avatar name={creator.name} seed={creator.account} src={creator.avatarUrl} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{creator.name}</p>
                    <p className="tnum text-sm text-muted">
                      {balance.toString()} held · {unlocked ? <span className="font-bold text-up">unlocked</span> : `${creator.unlockAt} to unlock`}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Creators */}
      <section id="creators" className="mx-auto max-w-[1200px] scroll-mt-24 px-4 pt-20 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-6">
          <h2 className="display text-3xl font-semibold sm:text-[2.6rem]">Creators</h2>
          <Link href="/launch" className="hidden text-sm font-bold text-plum underline-offset-4 hover:underline sm:block">
            Are you a creator? Launch your coin →
          </Link>
        </div>
        <CreatorTable creators={creators} loading={isLoading} />
      </section>

      {/* Activity + how it works */}
      <section className="mx-auto grid max-w-[1200px] gap-6 px-4 pt-20 sm:px-6 lg:grid-cols-[1fr_1.5fr]">
        <div className="rounded-card border border-line bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Latest trades</h2>
            <span className="flex items-center gap-2 text-xs font-bold text-muted">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-up" /> Live
            </span>
          </div>
          <div className="mt-2">
            <TradeFeed trades={(trades ?? []) as readonly Trade[]} creators={creators} empty="The first trade will show up here." />
          </div>
        </div>

        <div id="how" className="scroll-mt-24 rounded-card bg-ink p-6 text-paper sm:p-8">
          <h2 className="font-display text-lg font-semibold">How pricing works</h2>
          <p className="mt-2 max-w-md text-sm text-paper/70">
            No order books and no hidden supply. Every coin is minted from one public price curve, and the contract
            holds the USDT that backs it.
          </p>
          <ol className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2">
            <Step n="01" title="The first coin is the creator's">
              Launching mints coin #1 to the creator. It can never be sold, so the curve always has a floor.
            </Step>
            <Step n="02" title="Each coin costs a bit more">
              Coins start at {usdt(BASE_PRICE)} USDT and rise {usdt(PRICE_STEP)} USDT for every coin in circulation.
            </Step>
            <Step n="03" title="Sell back whenever you like">
              The contract keeps the reserve, so you can always sell back to the curve at the current price.
            </Step>
            <Step n="04" title="Creators earn on every trade">
              {CREATOR_FEE_PCT}% of every buy and sell goes straight to the creator. {PROTOCOL_FEE_PCT}% keeps the
              lights on.
            </Step>
          </ol>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="tnum font-display text-xl font-semibold">{value}</dd>
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <li className="border-t border-paper/15 pt-4">
      <span className="tnum font-display text-sm text-sun">{n}</span>
      <p className="mt-2 font-bold">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-paper/70">{children}</p>
    </li>
  );
}
