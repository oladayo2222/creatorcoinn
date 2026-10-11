import { Lock } from "./icons";

export function LockedNotice({ unlockAt, held, what }: { unlockAt: number; held: bigint; what: string }) {
  const need = Math.max(0, unlockAt - Number(held));
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-dashed border-line-strong bg-paper px-4 py-3.5 text-sm">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-sun">
        <Lock className="h-3.5 w-3.5" />
      </span>
      <p>
        <span className="font-bold">Hold {unlockAt} {unlockAt === 1 ? "coin" : "coins"} to {what}.</span>{" "}
        <span className="text-muted">
          {held > 0n ? `You hold ${held}, so ${need} more ${need === 1 ? "does" : "do"} it.` : "Buy from the panel to get in."}
        </span>
      </p>
    </div>
  );
}
