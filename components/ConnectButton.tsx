"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useConnect, useDisconnect, useReadContract, useSwitchChain } from "wagmi";
import { erc20Abi } from "@/lib/abi";
import { activeChain, addressUrl, USDT_ADDRESS } from "@/lib/chains";
import { shortAddress, usdt } from "@/lib/format";
import { ArrowUpRight, Copy } from "./icons";

export function ConnectButton({ className = "" }: { className?: string }) {
  const { address, chainId, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: balance } = useReadContract({
    address: USDT_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!mounted) return <div className={`pill pill-ink w-[150px] ${className}`} aria-hidden />;

  // Prefer wallets announced via EIP-6963, fall back to the generic injected connector.
  const wallets = connectors.filter((c) => c.id !== "injected");
  const options = wallets.length ? wallets : connectors;

  if (!isConnected) {
    return (
      <div ref={ref} className={`relative ${className}`}>
        <button
          className="pill pill-ink"
          disabled={isPending}
          onClick={() => (options.length === 1 ? connect({ connector: options[0] }) : setOpen((o) => !o))}
        >
          {isPending ? "Check your wallet…" : "Connect wallet"}
        </button>
        {open && (
          <Menu>
            {options.length === 0 || (options.length === 1 && options[0].id === "injected" && typeof window !== "undefined" && !("ethereum" in window)) ? (
              <p className="px-3 py-2 text-sm text-muted">
                No browser wallet found.{" "}
                <a className="text-plum underline" href="https://metamask.io/download/" target="_blank" rel="noreferrer">
                  Install MetaMask
                </a>
              </p>
            ) : (
              options.map((c) => (
                <button
                  key={c.uid}
                  onClick={() => {
                    connect({ connector: c });
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-wash"
                >
                  {c.icon ? <img src={c.icon} alt="" className="h-5 w-5 rounded" /> : <span className="h-5 w-5 rounded bg-wash" />}
                  {c.name}
                </button>
              ))
            )}
          </Menu>
        )}
      </div>
    );
  }

  if (chainId !== activeChain.id) {
    return (
      <button className={`pill pill-plum ${className}`} disabled={switching} onClick={() => switchChain({ chainId: activeChain.id })}>
        {switching ? "Switching…" : `Switch to ${activeChain.name}`}
      </button>
    );
  }

  const explorer = address ? addressUrl(address) : undefined;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button className="pill pill-line gap-3 pl-2 pr-4" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="tnum rounded-full bg-wash px-2.5 py-1 text-xs font-bold">{usdt(balance)} USDT</span>
        <span className="tnum">{shortAddress(address!)}</span>
      </button>
      {open && (
        <Menu>
          <button
            onClick={() => navigator.clipboard.writeText(address!)}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-wash"
          >
            <Copy /> Copy address
          </button>
          {explorer && (
            <a href={explorer} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-wash">
              <ArrowUpRight /> View on explorer
            </a>
          )}
          <div className="my-1 border-t border-line" />
          <button onClick={() => { disconnect(); setOpen(false); }} className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-down hover:bg-wash">
            Disconnect
          </button>
        </Menu>
      )}
    </div>
  );
}

function Menu({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute right-0 z-30 mt-2 w-60 rounded-2xl border border-line bg-card p-1.5 shadow-lift">{children}</div>
  );
}
