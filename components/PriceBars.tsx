import { priceAt } from "@/lib/curve";

/** Bars for the price of each coin on the curve, filled up to the current supply. */
export function PriceBars({ supply, className = "" }: { supply: number; className?: string }) {
  const total = Math.max(16, Math.ceil((supply + 6) / 4) * 4);
  const step = Math.max(1, Math.ceil(total / 24));
  const points = Array.from({ length: Math.ceil(total / step) }, (_, i) => i * step);
  const max = Number(priceAt(total));

  return (
    <div className={`flex h-16 items-end gap-[3px] ${className}`} aria-hidden>
      {points.map((k) => (
        <div
          key={k}
          className={`flex-1 rounded-[3px] ${k < supply ? "bg-ink" : "bg-line"} ${k === supply ? "!bg-coral" : ""}`}
          style={{ height: `${(Number(priceAt(k)) / max) * 100}%` }}
        />
      ))}
    </div>
  );
}
