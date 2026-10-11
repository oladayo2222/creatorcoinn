import hre from "hardhat";
import { getAddress } from "viem";

const USDT: Record<number, `0x${string}`> = {
  677: "0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C",
  968: "0x75edC9335175Fc0552D51D48439F229c10420fe3",
};

async function main() {
  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();
  const chainId = await publicClient.getChainId();
  const usdt = USDT[chainId];
  if (!usdt) throw new Error(`No USDT address for chain ${chainId}`);

  const treasury = getAddress(process.env.TREASURY_ADDRESS || deployer.account.address);
  console.log(`Deploying CreatorCoin to chain ${chainId} from ${deployer.account.address}`);

  const coin = await hre.viem.deployContract("CreatorCoin", [usdt, treasury]);
  console.log(`CreatorCoin: ${coin.address}`);
  console.log(`Set NEXT_PUBLIC_CREATORCOIN_ADDRESS=${coin.address} in the web app's .env.local`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
