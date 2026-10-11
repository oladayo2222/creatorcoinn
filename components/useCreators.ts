"use client";

import { useReadContract } from "wagmi";
import { coin, isConfigured, type Creator } from "@/lib/contract";

export function useCreators() {
  const { data, isLoading, error } = useReadContract({
    ...coin,
    functionName: "getCreators",
    args: [0n, 200n],
    query: { enabled: isConfigured, refetchInterval: 15_000 },
  });
  return { creators: (data ?? []) as readonly Creator[], isLoading: isLoading && isConfigured, error };
}
