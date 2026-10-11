"use client";

import { useState } from "react";
import { useReadContract } from "wagmi";
import { addressUrl } from "@/lib/chains";
import { coin, type Creator } from "@/lib/contract";
import { shortAddress, timeAgo } from "@/lib/format";
import { useTx } from "@/lib/useTx";
import { Avatar } from "./Avatar";
import { LockedNotice } from "./Locked";

export function RoomTab({ creator, access, held }: { creator: Creator; access: boolean; held: bigint }) {
  const [draft, setDraft] = useState("");
  const tx = useTx();
  const { data: messages, isLoading } = useReadContract({
    ...coin,
    functionName: "getMessages",
    args: [creator.account, 0n, 100n],
    query: { refetchInterval: 8_000 },
  });

  async function send() {
    const ok = await tx.send({ ...coin, functionName: "sendMessage", args: [creator.account, draft.trim()] });
    if (ok) setDraft("");
  }

  const ordered = [...(messages ?? [])].reverse();

  return (
    <div className="overflow-hidden rounded-card border border-line bg-card">
      <div className="border-b border-line px-5 py-4">
        <p className="font-display font-semibold">Holder room</p>
        <p className="text-sm text-muted">
          Only {creator.name} and fans holding {creator.unlockAt}+ coins can write here. Every message is a transaction on BOT Chain.
        </p>
      </div>

      <div className="max-h-[480px] space-y-5 overflow-y-auto px-5 py-5">
        {isLoading && <div className="h-20 animate-pulse rounded-xl bg-wash" />}
        {!isLoading && ordered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">Quiet so far. The first message sets the tone.</p>
        )}
        {ordered.map((m, i) => {
          const fromCreator = m.from.toLowerCase() === creator.account.toLowerCase();
          return (
            <div key={`${m.sentAt}-${i}`} className="flex gap-3">
              <Avatar name={fromCreator ? creator.name : m.from.slice(2, 4)} seed={m.from} src={fromCreator ? creator.avatarUrl : undefined} size={34} />
              <div className="min-w-0">
                <p className="text-sm">
                  <a href={addressUrl(m.from)} target="_blank" rel="noreferrer" className="font-bold hover:text-plum">
                    {fromCreator ? creator.name : shortAddress(m.from)}
                  </a>
                  {fromCreator && (
                    <span className="ml-2 rounded-full bg-sun px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">Creator</span>
                  )}
                  <span className="ml-2 text-muted">{timeAgo(m.sentAt)}</span>
                </p>
                <p className="mt-0.5 whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-line bg-paper px-5 py-4">
        {access ? (
          <div className="flex items-end gap-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 280))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && draft.trim() && !tx.busy) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder={`Say something to ${creator.name}'s holders`}
              className="field min-h-11 flex-1 resize-none py-2.5"
            />
            <button className="pill pill-ink" disabled={!draft.trim() || tx.busy} onClick={send}>
              {tx.busy ? "Sending…" : "Send"}
            </button>
          </div>
        ) : (
          <LockedNotice unlockAt={creator.unlockAt} held={held} what="write in this room" />
        )}
        {tx.error && <p className="mt-2 text-sm font-semibold text-down">{tx.error}</p>}
      </div>
    </div>
  );
}
