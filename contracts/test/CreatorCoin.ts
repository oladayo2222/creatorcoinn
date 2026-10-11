import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { getAddress, parseUnits } from "viem";

const usd = (n: string) => parseUnits(n, 6);

describe("CreatorCoin", () => {
  async function deploy() {
    const [owner, creator, fan, fan2, treasury] = await hre.viem.getWalletClients();
    const usdt = await hre.viem.deployContract("MockUSDT");
    const coin = await hre.viem.deployContract("CreatorCoin", [usdt.address, treasury.account.address]);

    for (const w of [creator, fan, fan2]) {
      await usdt.write.mint([w.account.address, usd("10000")]);
      await usdt.write.approve([coin.address, usd("10000")], { account: w.account });
    }

    const asCreator = await hre.viem.getContractAt("CreatorCoin", coin.address, { client: { wallet: creator } });
    const asFan = await hre.viem.getContractAt("CreatorCoin", coin.address, { client: { wallet: fan } });
    const asFan2 = await hre.viem.getContractAt("CreatorCoin", coin.address, { client: { wallet: fan2 } });

    await asCreator.write.register(["Tems Okafor", "tems", "Afro-soul from Lagos.", "", 3]);

    return { coin, usdt, owner, creator, fan, fan2, treasury, asCreator, asFan, asFan2 };
  }

  it("registers a creator with the first coin locked to them", async () => {
    const { coin, creator } = await loadFixture(deploy);
    const c = await coin.read.getCreator([creator.account.address]);
    expect(c.handle).to.equal("tems");
    expect(c.supply).to.equal(1);
    expect(c.holders).to.equal(1);
    expect(await coin.read.balanceOf([creator.account.address, creator.account.address])).to.equal(1n);
    expect(await coin.read.priceOf([creator.account.address])).to.equal(usd("0.15"));
  });

  it("rejects bad or duplicate handles", async () => {
    const { asFan, asFan2 } = await loadFixture(deploy);
    await expect(asFan.write.register(["X", "Tems", "", "", 1])).to.be.rejectedWith("InvalidHandle");
    await expect(asFan.write.register(["X", "ab", "", "", 1])).to.be.rejectedWith("InvalidHandle");
    await expect(asFan.write.register(["X", "tems", "", "", 1])).to.be.rejectedWith("HandleTaken");
    await asFan.write.register(["Fan", "fan_01", "", "", 1]);
    await expect(asFan2.write.register(["X", "x".repeat(21), "", "", 1])).to.be.rejectedWith("InvalidHandle");
  });

  it("charges the curve plus 7% fees and splits them", async () => {
    const { coin, usdt, creator, fan, treasury, asFan } = await loadFixture(deploy);
    const c = creator.account.address;
    // supply 1 → 4: prices 0.15 + 0.20 + 0.25 = 0.60
    const [cost, creatorFee, protocolFee, total] = await coin.read.buyQuote([c, 3n]);
    expect(cost).to.equal(usd("0.6"));
    expect(creatorFee).to.equal(usd("0.03"));
    expect(protocolFee).to.equal(usd("0.012"));
    expect(total).to.equal(usd("0.642"));

    const creatorBefore = await usdt.read.balanceOf([c]);
    await asFan.write.buy([c, 3n, total]);

    expect(await coin.read.balanceOf([c, fan.account.address])).to.equal(3n);
    expect(await usdt.read.balanceOf([coin.address])).to.equal(cost);
    expect((await usdt.read.balanceOf([c])) - creatorBefore).to.equal(creatorFee);
    expect(await usdt.read.balanceOf([treasury.account.address])).to.equal(protocolFee);
    const info = await coin.read.getCreator([c]);
    expect(info.supply).to.equal(4);
    expect(info.holders).to.equal(2);
  });

  it("enforces slippage on buy and sell", async () => {
    const { coin, creator, asFan } = await loadFixture(deploy);
    const c = creator.account.address;
    const [, , , total] = await coin.read.buyQuote([c, 2n]);
    await expect(asFan.write.buy([c, 2n, total - 1n])).to.be.rejectedWith("SlippageExceeded");
    await asFan.write.buy([c, 2n, total]);
    const [, , , payout] = await coin.read.sellQuote([c, 2n]);
    await expect(asFan.write.sell([c, 2n, payout + 1n])).to.be.rejectedWith("SlippageExceeded");
  });

  it("keeps the reserve solvent through buys and sells", async () => {
    const { coin, usdt, creator, asFan, asFan2, fan, fan2 } = await loadFixture(deploy);
    const c = creator.account.address;
    await asFan.write.buy([c, 10n, usd("100")]);
    await asFan2.write.buy([c, 5n, usd("100")]);
    await asFan.write.sell([c, 10n, 0n]);
    await asFan2.write.sell([c, 5n, 0n]);

    expect(await usdt.read.balanceOf([coin.address])).to.equal(0n);
    expect(await coin.read.balanceOf([c, fan.account.address])).to.equal(0n);
    expect(await coin.read.balanceOf([c, fan2.account.address])).to.equal(0n);
    const info = await coin.read.getCreator([c]);
    expect(info.supply).to.equal(1);
    expect(info.holders).to.equal(1);
    const [fans] = await coin.read.getHolders([c, 0n, 10n]);
    expect(fans.map((a) => getAddress(a))).to.deep.equal([getAddress(c)]);
  });

  it("never lets the last coin be sold", async () => {
    const { asCreator, creator } = await loadFixture(deploy);
    await expect(asCreator.write.sell([creator.account.address, 1n, 0n])).to.be.rejectedWith("LastCoinLocked");
  });

  it("gates the holder room on-chain", async () => {
    const { coin, creator, fan, asFan, asCreator } = await loadFixture(deploy);
    const c = creator.account.address;
    await expect(asFan.write.sendMessage([c, "hi"])).to.be.rejectedWith("Locked");

    await asFan.write.buy([c, 2n, usd("10")]);
    expect(await coin.read.hasAccess([c, fan.account.address])).to.equal(false);
    await asFan.write.buy([c, 1n, usd("10")]);
    expect(await coin.read.hasAccess([c, fan.account.address])).to.equal(true);

    await asFan.write.sendMessage([c, "first!"]);
    await asCreator.write.sendMessage([c, "welcome in"]);
    const msgs = await coin.read.getMessages([c, 0n, 10n]);
    expect(msgs.map((m) => m.body)).to.deep.equal(["welcome in", "first!"]);
  });

  it("only lets creators publish, newest first", async () => {
    const { coin, creator, asCreator, asFan } = await loadFixture(deploy);
    await expect(asFan.write.publish(["t", "b"])).to.be.rejectedWith("NotCreator");
    await asCreator.write.publish(["Demo #1", "Voice memo link"]);
    await asCreator.write.publish(["Demo #2", "Second take"]);
    const posts = await coin.read.getPosts([creator.account.address, 0n, 10n]);
    expect(posts.map((p) => p.title)).to.deep.equal(["Demo #2", "Demo #1"]);
  });

  it("tracks portfolio and recent trades", async () => {
    const { coin, creator, fan, asFan, asFan2 } = await loadFixture(deploy);
    const c = creator.account.address;
    await asFan2.write.register(["Second", "second", "", "", 1]);
    await asFan.write.buy([c, 1n, usd("10")]);
    await asFan.write.buy([getAddress((await coin.read.creatorByHandle(["second"])).account), 2n, usd("10")]);

    const [creators, balances] = await coin.read.getPortfolio([fan.account.address]);
    expect(creators.map((x) => x.handle)).to.deep.equal(["tems", "second"]);
    expect(balances).to.deep.equal([1n, 2n]);

    const trades = await coin.read.getRecentTrades([5n]);
    expect(trades.length).to.equal(2);
    expect(trades[0].amount).to.equal(2);
    expect((await coin.read.getCreatorTrades([c, 5n])).length).to.equal(1);

    const list = await coin.read.getCreators([0n, 10n]);
    expect(list.map((x) => x.handle)).to.deep.equal(["second", "tems"]);
  });
});
