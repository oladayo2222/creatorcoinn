// Local development only: deploys MockUSDT + CreatorCoin to a Hardhat node and fills it with sample activity.
import hre from "hardhat";
import { parseUnits } from "viem";

const usd = (n: string) => parseUnits(n, 6);

async function main() {
  const wallets = await hre.viem.getWalletClients();
  const [deployer] = wallets;
  const usdt = await hre.viem.deployContract("MockUSDT");
  const coin = await hre.viem.deployContract("CreatorCoin", [usdt.address, deployer.account.address]);

  for (const w of wallets.slice(0, 12)) {
    await usdt.write.mint([w.account.address, usd("5000")]);
    await usdt.write.approve([coin.address, usd("5000")], { account: w.account });
  }

  const as = (i: number) => hre.viem.getContractAt("CreatorCoin", coin.address, { client: { wallet: wallets[i] } });

  const creators = [
    { i: 1, name: "Sample Creator One", handle: "sample_one", bio: "Placeholder bio for local testing.", unlock: 3 },
    { i: 2, name: "Sample Creator Two", handle: "sample_two", bio: "Another placeholder profile.", unlock: 5 },
    { i: 3, name: "Sample Creator Three", handle: "sample_three", bio: "", unlock: 2 },
  ];
  for (const c of creators) {
    await (await as(c.i)).write.register([c.name, c.handle, c.bio, "", c.unlock]);
  }

  const c1 = wallets[1].account.address;
  const c2 = wallets[2].account.address;
  await (await as(4)).write.buy([c1, 4n, usd("100")]);
  await (await as(5)).write.buy([c1, 3n, usd("100")]);
  await (await as(6)).write.buy([c2, 6n, usd("100")]);
  await (await as(7)).write.buy([c1, 2n, usd("100")]);
  await (await as(4)).write.sell([c1, 1n, 0n]);

  await (await as(1)).write.publish(["First post for holders", "This body is only rendered for wallets that hold enough coins."]);
  await (await as(1)).write.sendMessage([c1, "Welcome to the room."]);
  await (await as(5)).write.sendMessage([c1, "Glad to be here."]);

  console.log(`NEXT_PUBLIC_NETWORK=local`);
  console.log(`NEXT_PUBLIC_CREATORCOIN_ADDRESS=${coin.address}`);
  console.log(`NEXT_PUBLIC_USDT_ADDRESS=${usdt.address}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
