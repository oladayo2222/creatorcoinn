"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useReadContract } from "wagmi";
import { activeChain, IS_TESTNET } from "@/lib/chains";
import { coin, isConfigured } from "@/lib/contract";
import { ConnectButton } from "./ConnectButton";
import { Logo } from "./Logo";

export function Header() {
  const pathname = usePathname();
  const { address } = useAccount();
  const { data: me } = useReadContract({
    ...coin,
    functionName: "getCreator",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) && isConfigured },
  });
  const myHandle = me && me.account !== "0x0000000000000000000000000000000000000000" ? me.handle : undefined;

  const links = [
    { href: "/#creators", label: "Explore" },
    myHandle ? { href: `/c/${myHandle}`, label: "Your page" } : { href: "/launch", label: "Launch a coin" },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-wash ${
                pathname === l.href ? "bg-wash" : ""
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs font-bold text-muted lg:inline-flex">
            <span className={`h-1.5 w-1.5 rounded-full ${IS_TESTNET ? "bg-coral" : "bg-up"}`} />
            {activeChain.name}
          </span>
          <ConnectButton />
        </div>
      </div>
      <nav className="flex gap-1 border-t border-line/70 px-4 py-2 md:hidden">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-wash">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
