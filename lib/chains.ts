import { defineChain, type Address } from "viem";
import { hardhat } from "viem/chains";

export const botMainnet = defineChain({
  id: 677,
  name: "BOT Chain",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.botchain.ai"] } },
  blockExplorers: { default: { name: "BOTScan", url: "https://scan.botchain.ai" } },
});

export const botTestnet = defineChain({
  id: 968,
  name: "BOT Chain Testnet",
  nativeCurrency: { name: "tBOT", symbol: "tBOT", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.bohr.life"] } },
  blockExplorers: { default: { name: "BOTScan Testnet", url: "https://scan.bohr.life" } },
  testnet: true,
});

const USDT_BY_CHAIN: Record<number, Address> = {
  [botMainnet.id]: "0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C",
  [botTestnet.id]: "0x75edC9335175Fc0552D51D48439F229c10420fe3",
};

const network = process.env.NEXT_PUBLIC_NETWORK ?? "testnet";

/** The one chain this deployment talks to. `local` is a Hardhat node for development. */
export const activeChain = network === "mainnet" ? botMainnet : network === "local" ? hardhat : botTestnet;

export const USDT_ADDRESS = (process.env.NEXT_PUBLIC_USDT_ADDRESS || USDT_BY_CHAIN[activeChain.id]) as Address;
export const CREATORCOIN_ADDRESS = process.env.NEXT_PUBLIC_CREATORCOIN_ADDRESS as Address | undefined;
export const USDT_DECIMALS = 6;

export const EXPLORER_URL = activeChain.blockExplorers?.default.url;
export const FAUCET_URL = "https://faucet.botchain.ai/basic";
export const IS_TESTNET = activeChain.id !== botMainnet.id;

export function addressUrl(address: string) {
  return EXPLORER_URL ? `${EXPLORER_URL}/address/${address}` : undefined;
}

export function txUrl(hash: string) {
  return EXPLORER_URL ? `${EXPLORER_URL}/tx/${hash}` : undefined;
}
