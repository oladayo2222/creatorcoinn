"use client";

import { useReadContract } from "wagmi";
import { addressUrl } from "@/lib/chains";
import { coin, type Creator } from "@/lib/contract";
import { shortAddress } from "@/lib/format";

export function HoldersTab({ creator, me }: { creator: Creator; me?: string }) {
  const { data } = useReadContract({ ...coin, functionName: "getHolders", args: [creator.account, 0n, 200n] });
  const rows = data ? data[0].map((a, i) => ({ address: a, balance: data[1][i] })).sort((a, b) => Number(b.balance - a.balance)) : [];

  return (
    <div className="overflow-hidden rounded-card border border-line bg-card">
      <ul className="divide-y divide-line">
        {rows.map((r, i) => {
          const share = (Number(r.balance) / creator.supply) * 100;
          const isCreator = r.address.toLowerCase() === creator.account.toLowerCase();
          const isMe = me && r.address.toLowerCase() === me.toLowerCase();
          return (
            <li key={r.address} className="flex items-center gap-4 px-5 py-3.5 text-sm">
              <span className="tnum w-6 font-bold text-muted">{i + 1}</span>
              <a href={addressUrl(r.address)} target="_blank" rel="noreferrer" className="tnum font-bold hover:text-plum">
                {shortAddress(r.address)}
              </a>
              {isCreator && <span className="rounded-full bg-sun px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">Creator</span>}
              {isMe && <span className="rounded-full bg-plum-soft px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-plum-deep">You</span>}
              <div className="ml-auto flex items-center gap-4">
                <div className="hidden h-1.5 w-28 overflow-hidden rounded-full bg-wash sm:block">
                  <div className="h-full rounded-full bg-ink" style={{ width: `${share}%` }} />
                </div>
                <span className="tnum w-24 text-right font-semibold">
                  {r.balance.toString()} <span className="text-muted">· {share.toFixed(0)}%</span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
