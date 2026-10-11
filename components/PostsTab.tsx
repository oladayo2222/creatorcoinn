"use client";

import { useState } from "react";
import { useReadContract } from "wagmi";
import { coin, type Creator } from "@/lib/contract";
import { timeAgo } from "@/lib/format";
import { useTx } from "@/lib/useTx";
import { LockedNotice } from "./Locked";
import { Lock } from "./icons";

export function PostsTab({ creator, access, isOwner, held }: { creator: Creator; access: boolean; isOwner: boolean; held: bigint }) {
  const { data: posts, isLoading } = useReadContract({
    ...coin,
    functionName: "getPosts",
    args: [creator.account, 0n, 50n],
  });

  return (
    <div className="space-y-4">
      {isOwner && <Composer />}
      {!access && <LockedNotice unlockAt={creator.unlockAt} held={held} what="read these posts" />}

      {isLoading && <div className="h-32 animate-pulse rounded-card bg-wash" />}

      {!isLoading && posts?.length === 0 && (
        <p className="rounded-card border border-line bg-card px-6 py-12 text-center text-muted">
          {isOwner ? "Your holders are waiting. Publish your first post above." : `${creator.name} hasn't posted yet.`}
        </p>
      )}

      {posts?.map((p, i) => (
        <article key={`${p.createdAt}-${i}`} className="rounded-card border border-line bg-card p-5 sm:p-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
            <span>{timeAgo(p.createdAt)}</span>
            {!access && (
              <span className="inline-flex items-center gap-1 rounded-full bg-wash px-2 py-0.5 normal-case tracking-normal">
                <Lock className="h-3 w-3" /> Holders only
              </span>
            )}
          </div>
          <h3 className="mt-2 font-display text-lg font-semibold leading-snug">{p.title}</h3>
          {access ? (
            <p className="mt-3 whitespace-pre-wrap break-words leading-relaxed text-ink-soft">
              <Linkified text={p.body} />
            </p>
          ) : (
            <div className="mt-4 space-y-2" aria-label="Locked content">
              {[92, 100, 76].map((w) => (
                <div key={w} className="h-3 rounded-full bg-wash" style={{ width: `${w}%` }} />
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noreferrer noopener" className="font-semibold text-plum underline break-all">
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </>
  );
}

function Composer() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const tx = useTx();

  async function publish() {
    const ok = await tx.send({ ...coin, functionName: "publish", args: [title.trim(), body.trim()] });
    if (ok) {
      setTitle("");
      setBody("");
    }
  }

  return (
    <div className="rounded-card border border-ink bg-card p-5">
      <p className="eyebrow">New post for holders</p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value.slice(0, 120))}
        placeholder="Title — everyone can see this"
        className="mt-3 w-full bg-transparent font-display text-lg font-semibold placeholder:text-[#9a968d] focus:outline-none"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, 2000))}
        placeholder="What's only for holders? A demo, a link, early tickets, a voice note…"
        rows={4}
        className="mt-2 w-full resize-y bg-transparent leading-relaxed placeholder:text-[#9a968d] focus:outline-none"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <span className="tnum text-xs text-muted">{body.length}/2000</span>
        <div className="flex items-center gap-3">
          {tx.error && <span className="text-sm font-semibold text-down">{tx.error}</span>}
          <button className="pill pill-ink" disabled={!title.trim() || !body.trim() || tx.busy} onClick={publish}>
            {tx.busy ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
