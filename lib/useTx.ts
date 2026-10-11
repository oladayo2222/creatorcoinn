"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Hash } from "viem";
import { useAccount, usePublicClient, useSwitchChain, useWriteContract } from "wagmi";
import { activeChain } from "./chains";
import { readableError } from "./errors";

type Status = "idle" | "signing" | "pending" | "done" | "error";
type Request = Parameters<ReturnType<typeof useWriteContract>["writeContractAsync"]>[0];

/** Sends a contract write, waits for the receipt, then refreshes every on-chain read. */
export function useTx() {
  const { chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const client = usePublicClient();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>("idle");
  const [hash, setHash] = useState<Hash>();
  const [error, setError] = useState<string>();

  async function send(request: Request) {
    setError(undefined);
    setHash(undefined);
    setStatus("signing");
    try {
      if (chainId !== activeChain.id) await switchChainAsync({ chainId: activeChain.id });
      // Callers stay fully typed via `Request`; the cast only bridges wagmi's chain-id generics.
      const txHash = await writeContractAsync({ ...request, chainId: activeChain.id } as never);
      setHash(txHash);
      setStatus("pending");
      const receipt = await client!.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== "success") throw new Error("The transaction reverted.");
      setStatus("done");
      await queryClient.invalidateQueries();
      return txHash;
    } catch (err) {
      setError(readableError(err));
      setStatus("error");
      return undefined;
    }
  }

  return { send, status, hash, error, busy: status === "signing" || status === "pending" };
}
