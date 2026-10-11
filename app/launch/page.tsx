"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { keccak256, toBytes, zeroAddress } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { Avatar } from "@/components/Avatar";
import { ConnectButton } from "@/components/ConnectButton";
import { PriceBars } from "@/components/PriceBars";
import { ArrowRight, Check } from "@/components/icons";
import { activeChain, FAUCET_URL, IS_TESTNET } from "@/lib/chains";
import { coin, isConfigured } from "@/lib/contract";
import { BASE_PRICE, CREATOR_FEE_PCT, priceAt } from "@/lib/curve";
import { usdt } from "@/lib/format";
import { useTx } from "@/lib/useTx";

const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

export default function LaunchPage() {
  const router = useRouter();
  const { address, isConnected, chainId } = useAccount();
  const tx = useTx();

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [unlockAt, setUnlockAt] = useState(3);
  const [debouncedHandle, setDebouncedHandle] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedHandle(handle), 350);
    return () => clearTimeout(t);
  }, [handle]);

  const handleValid = HANDLE_RE.test(handle);
  const { data: owner, isFetching: checking } = useReadContract({
    ...coin,
    functionName: "handleOwner",
    args: [keccak256(toBytes(debouncedHandle))],
    query: { enabled: isConfigured && HANDLE_RE.test(debouncedHandle) },
  });
  const taken = debouncedHandle === handle && owner !== undefined && owner !== zeroAddress;
  const available = debouncedHandle === handle && owner === zeroAddress;

  const { data: me } = useReadContract({
    ...coin,
    functionName: "getCreator",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) && isConfigured },
  });
  const existing = me && me.account !== zeroAddress ? me : undefined;

  const canSubmit = name.trim().length > 0 && handleValid && !taken && !tx.busy && isConfigured;

  async function launch() {
    const ok = await tx.send({
      ...coin,
      functionName: "register",
      args: [name.trim(), handle, bio.trim(), avatarUrl.trim(), unlockAt],
    });
    if (ok) router.push(`/c/${handle}`);
  }

  if (existing) {
    return (
      <div className="mx-auto max-w-xl px-4 py-28 text-center">
        <p className="eyebrow">You&apos;re already live</p>
        <h1 className="display mt-4 text-4xl font-semibold">@{existing.handle} has a coin</h1>
        <p className="mt-4 text-muted">One coin per wallet. Head to your page to post for holders and watch your curve.</p>
        <Link href={`/c/${existing.handle}`} className="pill pill-ink mt-8">
          Go to your page <ArrowRight />
        </Link>
      </div>
    );
  }

  const unlockCost = (() => {
    // what a fan pays (before fees) to unlock, if they're the first buyer
    let total = 0n;
    for (let k = 1; k <= unlockAt; k++) total += priceAt(k);
    return total;
  })();

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-12 sm:px-6 lg:pt-16">
      <div className="max-w-2xl">
        <p className="eyebrow">Launch your coin</p>
        <h1 className="display mt-4 text-4xl font-semibold uppercase sm:text-6xl">
          Your fans,
          <br />
          <span className="text-plum">on the curve.</span>
        </h1>
        <p className="mt-5 text-lg text-ink-soft">
          It takes one transaction. You get coin #1, and from then on you earn {CREATOR_FEE_PCT}% of every buy and sell
          of your coin, paid to your wallet in USDT.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-[minmax(0,1fr)] items-start gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
        <form
          className="space-y-7 rounded-card border border-line bg-card p-6 sm:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) launch();
          }}
        >
          <Field label="Display name" hint={`${name.length}/40`}>
            <input className="field" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Ada Obi" />
          </Field>

          <Field
            label="Handle"
            hint={
              !handle ? "3–20 characters" : !handleValid ? (
                <span className="text-down">Lowercase letters, numbers and _ only</span>
              ) : checking || debouncedHandle !== handle ? (
                "Checking…"
              ) : taken ? (
                <span className="text-down">Taken</span>
              ) : available ? (
                <span className="inline-flex items-center gap-1 text-up"><Check className="h-3.5 w-3.5" /> Available</span>
              ) : null
            }
          >
            <div className="flex items-center rounded-[0.875rem] border border-line-strong bg-card focus-within:border-ink">
              <span className="pl-4 font-bold text-muted">@</span>
              <input
                className="w-full bg-transparent py-3 pl-1 pr-4 focus:outline-none"
                value={handle}
                maxLength={20}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/\s/g, "_"))}
                placeholder="adaobi"
                autoCapitalize="none"
                spellCheck={false}
              />
            </div>
          </Field>

          <Field label="Bio" hint={`${bio.length}/280`}>
            <textarea
              className="field resize-y"
              rows={3}
              value={bio}
              maxLength={280}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What do you make, and what do holders get?"
            />
          </Field>

          <Field label="Avatar image URL" hint="Optional">
            <input className="field" value={avatarUrl} maxLength={300} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
          </Field>

          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="unlock" className="text-sm font-bold">Coins needed to unlock</label>
              <span className="tnum font-display text-lg font-semibold">{unlockAt}</span>
            </div>
            <input
              id="unlock"
              type="range"
              min={1}
              max={20}
              value={unlockAt}
              onChange={(e) => setUnlockAt(Number(e.target.value))}
              className="mt-3 w-full accent-[#161613]"
            />
            <p className="mt-2 text-sm text-muted">
              Your first fan would pay about <span className="tnum font-bold text-ink">{usdt(unlockCost)} USDT</span> to
              unlock your posts and holder room. Later fans pay more as the curve rises.
            </p>
          </div>

          <div className="border-t border-line pt-6">
            {!isConnected || chainId !== activeChain.id ? (
              <ConnectButton />
            ) : (
              <button type="submit" className="pill pill-ink w-full sm:w-auto" disabled={!canSubmit}>
                {tx.status === "signing" ? "Confirm in your wallet…" : tx.status === "pending" ? "Launching on BOT Chain…" : "Launch my coin"}
              </button>
            )}
            {tx.error && <p className="mt-3 text-sm font-semibold text-down">{tx.error}</p>}
            {IS_TESTNET && (
              <p className="mt-3 text-sm text-muted">
                You need a little tBOT for gas.{" "}
                <a href={FAUCET_URL} target="_blank" rel="noreferrer" className="font-bold text-plum hover:underline">Get some from the faucet</a>.
              </p>
            )}
          </div>
        </form>

        {/* Preview */}
        <div className="lg:sticky lg:top-24">
          <p className="eyebrow mb-3">Preview</p>
          <div className="rounded-[1.75rem] border border-line bg-card p-6 shadow-lift">
            <div className="flex items-center gap-3">
              <Avatar name={name || "Your name"} seed={handle || "preview"} src={avatarUrl || undefined} size={56} />
              <div className="min-w-0">
                <p className="truncate font-display font-semibold">{name || "Your name"}</p>
                <p className="truncate text-sm text-muted">@{handle || "handle"}</p>
              </div>
            </div>
            <p className="mt-4 line-clamp-3 min-h-[3rem] text-sm text-ink-soft">{bio || "Your bio shows up here."}</p>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="eyebrow">First fan pays</p>
                <p className="tnum font-display text-3xl font-semibold">
                  {usdt(priceAt(1))}
                  <span className="ml-1 font-sans text-sm font-bold text-muted">USDT</span>
                </p>
              </div>
              <span className="rounded-full bg-plum-soft px-3 py-1 text-xs font-bold text-plum-deep">Unlock at {unlockAt}</span>
            </div>
            <PriceBars supply={1} className="mt-5" />
            <p className="mt-3 text-xs text-muted">
              Curve starts at {usdt(BASE_PRICE)} USDT. Coin #1 is yours and can&apos;t be sold.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-baseline justify-between text-sm">
        <span className="font-bold">{label}</span>
        <span className="tnum text-muted">{hint}</span>
      </span>
      {children}
    </label>
  );
}
