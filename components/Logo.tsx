import Link from "next/link";

export function CoinMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#161613" />
      <circle cx="32" cy="32" r="21" fill="none" stroke="#f9d86a" strokeWidth="3" />
      <path d="M38.5 25.5a9 9 0 1 0 0 13" fill="none" stroke="#f8f7f3" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="CreatorCoin home">
      <CoinMark />
      <span className="font-display text-[15px] font-semibold tracking-tight">creatorcoin</span>
    </Link>
  );
}
