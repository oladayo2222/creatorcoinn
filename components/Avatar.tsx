"use client";

import { useState } from "react";

const TILES = [
  "bg-plum text-white",
  "bg-coral text-ink",
  "bg-sun text-ink",
  "bg-ink text-sun",
  "bg-plum-soft text-plum-deep",
  "bg-coral-soft text-ink",
];

function tileFor(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TILES[h % TILES.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

export function Avatar({
  name,
  seed,
  src,
  size = 44,
  className = "",
}: {
  name: string;
  seed: string;
  src?: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const radius = size >= 80 ? "rounded-[1.5rem]" : size >= 40 ? "rounded-xl" : "rounded-lg";
  const style = { width: size, height: size };

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        style={style}
        onError={() => setFailed(true)}
        className={`${radius} shrink-0 object-cover bg-wash ${className}`}
      />
    );
  }
  return (
    <div
      style={{ ...style, fontSize: size * 0.36 }}
      className={`${radius} ${tileFor(seed)} font-display shrink-0 grid place-items-center font-semibold ${className}`}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
