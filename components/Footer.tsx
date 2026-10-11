import Link from "next/link";
import { CREATORCOIN_ADDRESS, addressUrl } from "@/lib/chains";
import { shortAddress } from "@/lib/format";
import { CoinMark } from "./Logo";
import { ArrowUpRight } from "./icons";

export function Footer() {
  const contractUrl = CREATORCOIN_ADDRESS ? addressUrl(CREATORCOIN_ADDRESS) : undefined;

  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <CoinMark className="h-9 w-9" />
            <span className="font-display text-xl font-semibold tracking-tight">creatorcoin</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted">
            Every creator gets their own coin. Fans hold it to unlock private posts and the holder room.
          </p>
        </div>

        <div>
          <p className="eyebrow">Product</p>
          <ul className="mt-4 space-y-2.5 text-sm font-semibold">
            <li><Link href="/#creators" className="hover:text-plum">Explore creators</Link></li>
            <li><Link href="/launch" className="hover:text-plum">Launch your coin</Link></li>
            <li><Link href="/#how" className="hover:text-plum">How pricing works</Link></li>
            {contractUrl && (
              <li>
                <a href={contractUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-plum">
                  Contract {shortAddress(CREATORCOIN_ADDRESS!)} <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </li>
            )}
          </ul>
        </div>

        <div id="ecosystem">
          <p className="eyebrow">Ecosystem</p>
          <div className="mt-4 rounded-card border border-line bg-card p-5">
            <p className="font-display text-base font-semibold">Built on BOT Chain</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold">
              <li>
                <a href="https://botchain.ai" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-plum hover:underline">
                  https://botchain.ai <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </li>
              <li>
                <a href="https://scan.botchain.ai" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-plum hover:underline">
                  https://scan.botchain.ai <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} CreatorCoin</span>
          <span>Coins are priced in USDT on BOT Chain. Prices move with demand; only buy what you're happy to hold.</span>
        </div>
      </div>
    </footer>
  );
}
