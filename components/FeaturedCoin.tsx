import Link from "next/link";
import type { Creator } from "@/lib/contract";
import { BASE_PRICE, priceAt } from "@/lib/curve";
import { usdt } from "@/lib/format";
import { Avatar } from "./Avatar";
import { PriceBars } from "./PriceBars";
import { ArrowRight } from "./icons";

export function FeaturedCoin({ creator }: { creator?: Creator }) {
  return (
    <div className="relative mx-auto w-full max-w-[400px] pt-6 lg:ml-auto lg:mr-4">
      {/* card peeking out behind */}
      <div className="absolute inset-x-6 top-0 h-full rotate-[5deg] rounded-[1.75rem] bg-coral" aria-hidden />
      <div className="absolute inset-x-3 top-3 h-full rotate-[2deg] rounded-[1.75rem] bg-sun" aria-hidden />

      <div className="relative -rotate-[2deg] rounded-[1.75rem] border border-ink/10 bg-card p-6 shadow-glow">
        {creator ? <Filled creator={creator} /> : <Empty />}
      </div>
    </div>
  );
}

function Filled({ creator }: { creator: Creator }) {
  const price = priceAt(creator.supply);
  const change = ((Number(price) - Number(priceAt(1))) / Number(priceAt(1))) * 100;

  return (
    <>
      <div className="flex items-center gap-3">
        <Avatar name={creator.name} seed={creator.account} src={creator.avatarUrl} size={48} />
        <div className="min-w-0">
          <p className="truncate font-display text-[15px] font-semibold">{creator.name}</p>
          <p className="text-sm text-muted">@{creator.handle}</p>
        </div>
        <span className="ml-auto shrink-0 whitespace-nowrap rounded-full bg-sun-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">Top coin</span>
      </div>

      <div className="mt-6 flex items-end justify-between">
        <div>
          <p className="eyebrow">Next coin</p>
          <p className="tnum mt-1 font-display text-4xl font-semibold">
            {usdt(price)}
            <span className="ml-1.5 font-sans text-base font-bold text-muted">USDT</span>
          </p>
        </div>
        <p className={`tnum text-sm font-bold ${change > 0 ? "text-up" : "text-muted"}`}>
          {change > 0 ? `+${change.toFixed(0)}%` : "0%"} since launch
        </p>
      </div>

      <PriceBars supply={creator.supply} className="mt-5" />

      <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4 text-sm">
        <div><dt className="text-muted">Holders</dt><dd className="tnum font-bold">{creator.holders}</dd></div>
        <div><dt className="text-muted">Supply</dt><dd className="tnum font-bold">{creator.supply}</dd></div>
        <div><dt className="text-muted">Unlock at</dt><dd className="tnum font-bold">{creator.unlockAt} coins</dd></div>
      </dl>

      <Link href={`/c/${creator.handle}`} className="pill pill-ink mt-5 w-full">
        Open coin <ArrowRight />
      </Link>
    </>
  );
}

function Empty() {
  return (
    <>
      <p className="eyebrow">Coin #1 on the curve</p>
      <p className="tnum mt-2 font-display text-4xl font-semibold">
        {usdt(BASE_PRICE)}
        <span className="ml-1.5 font-sans text-base font-bold text-muted">USDT</span>
      </p>
      <p className="mt-2 text-sm text-muted">No creators yet. The first coin launched here starts at the bottom of the curve.</p>
      <PriceBars supply={1} className="mt-5" />
      <Link href="/launch" className="pill pill-ink mt-6 w-full">
        Launch the first coin <ArrowRight />
      </Link>
    </>
  );
}
