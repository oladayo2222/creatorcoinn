"use client";

import { useState } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { erc20Abi } from "@/lib/abi";
import { activeChain, CREATORCOIN_ADDRESS, FAUCET_URL, IS_TESTNET, txUrl, USDT_ADDRESS } from "@/lib/chains";
import { coin, type Creator } from "@/lib/contract";
import { CREATOR_FEE_PCT, MAX_TRADE, PROTOCOL_FEE_PCT } from "@/lib/curve";
import { usdt } from "@/lib/format";
import { useTx } from "@/lib/useTx";
import { ConnectButton } from "./ConnectButton";
import { ArrowUpRight, Minus, Plus } from "./icons";

type Side = "buy" | "sell";

/** 2% headroom so a trade still lands if someone else trades first. */
const withSlippage = (v: bigint, side: Side) => (side === "buy" ? v + v / 50n : v - v / 50n);

export function TradePanel({ creator, held }: { creator: Creator; held: bigint }) {
  const { address, chainId, isConnected } = useAccount();
  const [side, setSide] = useState<Side>("buy");
  const [amount, setAmount] = useState(1);
  const tx = useTx();

  const sellable = BigInt(Math.max(0, Math.min(Number(held), creator.supply - 1)));
  const max = side === "buy" ? MAX_TRADE : Math.min(MAX_TRADE, Number(sellable));
  const qty = Math.max(1, Math.min(amount, Math.max(max, 1)));

  const { data: quotes } = useReadContracts({
    contracts: [
      { ...coin, functionName: "buyQuote", args: [creator.account, BigInt(qty)] },
      { ...coin, functionName: "sellQuote", args: [creator.account, BigInt(qty)] },
    ],
    query: { refetchInterval: 10_000 },
  });
  const buyQuote = quotes?.[0].result;
  const sellQuote = quotes?.[1].result;

  const { data: wallet } = useReadContracts({
    contracts: [
      { address: USDT_ADDRESS, abi: erc20Abi, functionName: "balanceOf", args: [address!] },
      { address: USDT_ADDRESS, abi: erc20Abi, functionName: "allowance", args: [address!, CREATORCOIN_ADDRESS!] },
    ],
    query: { enabled: Boolean(address) },
  });
  const balance = wallet?.[0].result;
  const allowance = wallet?.[1].result ?? 0n;

  const { data: nextHasAccess } = useReadContract({
    ...coin,
    functionName: "hasAccess",
    args: address ? [creator.account, address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const total = side === "buy" ? buyQuote?.[3] : sellQuote?.[3];
  const curve = side === "buy" ? buyQuote?.[0] : sellQuote?.[0];
  const creatorFee = side === "buy" ? buyQuote?.[1] : sellQuote?.[1];
  const protocolFee = side === "buy" ? buyQuote?.[2] : sellQuote?.[2];
  const limit = total !== undefined ? withSlippage(total, side) : undefined;

  const needsApproval = side === "buy" && limit !== undefined && allowance < limit;
  const notEnoughUsdt = side === "buy" && balance !== undefined && total !== undefined && balance < total;
  const toUnlock = Math.max(0, creator.unlockAt - Number(held));

  async function submit() {
    if (limit === undefined) return;
    if (side === "buy") {
      if (needsApproval) {
        await tx.send({ address: USDT_ADDRESS, abi: erc20Abi, functionName: "approve", args: [CREATORCOIN_ADDRESS!, limit] });
        return;
      }
      const ok = await tx.send({ ...coin, functionName: "buy", args: [creator.account, BigInt(qty), limit] });
      if (ok) setAmount(1);
    } else {
      const ok = await tx.send({ ...coin, functionName: "sell", args: [creator.account, BigInt(qty), limit] });
      if (ok) setAmount(1);
    }
  }

  let label: string;
  if (tx.status === "signing") label = "Confirm in your wallet…";
  else if (tx.status === "pending") label = "Waiting for BOT Chain…";
  else if (side === "sell" && sellable === 0n) label = "Nothing to sell yet";
  else if (notEnoughUsdt) label = "Not enough USDT";
  else if (needsApproval) label = `Step 1 of 2 · Approve ${usdt(limit)} USDT`;
  else if (side === "buy") label = `Buy ${qty} for ${usdt(total)} USDT`;
  else label = `Sell ${qty} for ${usdt(total)} USDT`;

  return (
    <div className="rounded-card border border-line bg-card p-5 sm:p-6">
      <div className="grid grid-cols-2 gap-1 rounded-full bg-wash p-1" role="tablist" aria-label="Trade side">
        {(["buy", "sell"] as Side[]).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={side === s}
            onClick={() => {
              setSide(s);
              setAmount(1);
            }}
            className={`rounded-full py-2 text-sm font-bold capitalize transition-colors ${
              side === s ? "bg-card text-ink shadow-lift" : "text-muted hover:text-ink"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <label htmlFor="qty" className="text-sm font-bold">
            Coins
          </label>
          <span className="tnum text-sm text-muted">You hold {held.toString()}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button
            className="grid h-12 w-12 place-items-center rounded-full border border-line-strong hover:border-ink disabled:opacity-40"
            onClick={() => setAmount(Math.max(1, qty - 1))}
            disabled={qty <= 1}
            aria-label="One fewer"
          >
            <Minus />
          </button>
          <input
            id="qty"
            inputMode="numeric"
            value={qty}
            onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, "")) || 1)}
            className="tnum h-12 min-w-0 flex-1 rounded-full border border-line-strong bg-card text-center font-display text-xl font-semibold focus:border-ink focus:outline-none"
          />
          <button
            className="grid h-12 w-12 place-items-center rounded-full border border-line-strong hover:border-ink disabled:opacity-40"
            onClick={() => setAmount(Math.min(max, qty + 1))}
            disabled={qty >= max}
            aria-label="One more"
          >
            <Plus />
          </button>
        </div>
        {side === "buy" && toUnlock > 1 && (
          <button
            onClick={() => setAmount(toUnlock)}
            className="mt-3 rounded-full bg-plum-soft px-3 py-1.5 text-xs font-bold text-plum-deep hover:bg-plum hover:text-white"
          >
            Buy {toUnlock} to unlock posts + room
          </button>
        )}
      </div>

      <dl className="tnum mt-6 space-y-2.5 border-t border-line pt-5 text-sm">
        <Row label={side === "buy" ? "Curve price" : "Curve value"} value={curve} />
        <Row label={`Creator fee · ${CREATOR_FEE_PCT}%`} value={creatorFee} />
        <Row label={`Protocol fee · ${PROTOCOL_FEE_PCT}%`} value={protocolFee} />
        <div className="flex justify-between border-t border-line pt-3 text-base">
          <dt className="font-bold">{side === "buy" ? "You pay" : "You receive"}</dt>
          <dd className="font-display font-semibold">{usdt(total)} USDT</dd>
        </div>
      </dl>

      <div className="mt-6">
        {!isConnected ? (
          <ConnectButton className="[&>button]:w-full" />
        ) : chainId !== activeChain.id ? (
          <ConnectButton className="w-full [&]:w-full" />
        ) : (
          <button
            className={`pill w-full ${needsApproval ? "pill-plum" : "pill-ink"}`}
            disabled={tx.busy || total === undefined || notEnoughUsdt || (side === "sell" && sellable === 0n)}
            onClick={submit}
          >
            {label}
          </button>
        )}
      </div>

      <div className="mt-4 space-y-2 text-sm">
        {isConnected && balance !== undefined && (
          <p className="tnum text-muted">Wallet balance: {usdt(balance)} USDT</p>
        )}
        {needsApproval && !tx.busy && (
          <p className="text-muted">You approve the exact amount for this buy, then confirm the buy itself.</p>
        )}
        {notEnoughUsdt && IS_TESTNET && (
          <a href={FAUCET_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-plum hover:underline">
            Get test USDT from the BOT Chain faucet <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        )}
        {tx.error && <p className="font-semibold text-down">{tx.error}</p>}
        {tx.status === "done" && tx.hash && (
          <p className="font-semibold text-up">
            Confirmed.{" "}
            <a href={txUrl(tx.hash)} target="_blank" rel="noreferrer" className="underline">
              View transaction
            </a>
            {nextHasAccess && side === "buy" ? " · Posts and room unlocked." : ""}
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: bigint }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold">{usdt(value)} USDT</dd>
    </div>
  );
}
