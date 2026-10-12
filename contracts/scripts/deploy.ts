import hre from "hardhat";
import { createPublicClient, createWalletClient, defineChain, formatEther, getAddress, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// hardhat-viem only knows chains bundled with viem, so BOT Chain is defined here.
const CHAINS = {
  botTestnet: defineChain({
    id: 968,
    name: "BOT Chain Testnet",
    nativeCurrency: { name: "tBOT", symbol: "tBOT", decimals: 18 },
    rpcUrls: { default: { http: ["https://rpc.bohr.life"] } },
    blockExplorers: { default: { name: "BOTScan Testnet", url: "https://scan.bohr.life" } },
  }),
  botMainnet: defineChain({
    id: 677,
    name: "BOT Chain",
    nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
    rpcUrls: { default: { http: ["https://rpc.botchain.ai"] } },
    blockExplorers: { default: { name: "BOTScan", url: "https://scan.botchain.ai" } },
  }),
};

const USDT: Record<number, `0x${string}`> = {
  677: "0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C",
  968: "0x75edC9335175Fc0552D51D48439F229c10420fe3",
};

async function main() {
  const chain = CHAINS[hre.network.name as keyof typeof CHAINS];
  if (!chain) throw new Error(`Run with --network botTestnet or --network botMainnet`);

  const rawKey = process.env.DEPLOYER_PRIVATE_KEY?.trim();
  if (!rawKey) throw new Error("DEPLOYER_PRIVATE_KEY is missing from contracts/.env");
  const account = privateKeyToAccount((rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`) as Hex);

  const publicClient = createPublicClient({ chain, transport: http() });
  const walletClient = createWalletClient({ account, chain, transport: http() });

  const balance = await publicClient.getBalance({ address: account.address });
  const treasury = getAddress(process.env.TREASURY_ADDRESS || account.address);
  console.log(`Deploying CreatorCoin to ${chain.name} (${chain.id})`);
  console.log(`Deployer ${account.address} · ${formatEther(balance)} ${chain.nativeCurrency.symbol}`);
  console.log(`USDT ${USDT[chain.id]} · treasury ${treasury}`);

  const { abi, bytecode } = await hre.artifacts.readArtifact("CreatorCoin");
  const hash = await walletClient.deployContract({ abi, bytecode: bytecode as Hex, args: [USDT[chain.id], treasury] });
  console.log(`Tx ${chain.blockExplorers.default.url}/tx/${hash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success" || !receipt.contractAddress) throw new Error("Deployment reverted");

  console.log(`CreatorCoin: ${receipt.contractAddress}`);
  console.log(`Explorer: ${chain.blockExplorers.default.url}/address/${receipt.contractAddress}`);
  console.log(`Gas used: ${receipt.gasUsed} · cost ${formatEther(receipt.gasUsed * receipt.effectiveGasPrice)} ${chain.nativeCurrency.symbol}`);
  console.log(`\nSet NEXT_PUBLIC_CREATORCOIN_ADDRESS=${receipt.contractAddress} in the web app's .env.local`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
