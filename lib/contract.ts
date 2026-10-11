import { creatorCoinAbi } from "./abi";
import { CREATORCOIN_ADDRESS } from "./chains";

export const coin = { address: CREATORCOIN_ADDRESS!, abi: creatorCoinAbi } as const;
export const isConfigured = Boolean(CREATORCOIN_ADDRESS);

export type Creator = {
  account: `0x${string}`;
  name: string;
  handle: string;
  bio: string;
  avatarUrl: string;
  joinedAt: bigint;
  unlockAt: number;
  supply: number;
  holders: number;
  postCount: number;
  messageCount: number;
  volume: bigint;
  feesEarned: bigint;
};
