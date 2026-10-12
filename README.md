# CreatorCoin

Every creator gets their own coin. Fans buy to get access to private content and chats.

Built for the 45-in-90 BOTChain Challenge.
Chain: BOT Chain Testnet (968) → Mainnet (677)
Tech: Next.js, Solidity, Wagmi, Tailwind

## Deployments

| Network | CreatorCoin | Explorer |
|---|---|---|
| BOT Chain Testnet (968) | `0x2faddc7126524dd58f348ee402127445fca0b38c` | [verified source](https://scan.bohr.life/address/0x2faddc7126524dd58f348ee402127445fca0b38c#code) |

## How it works

- A creator calls `register` and gets coin #1, which can never be sold.
- Fans `buy` with USDT on a linear curve: 0.10 USDT + 0.05 USDT per coin in circulation.
  5% goes to the creator, 2% to the treasury, and the rest stays in the contract as the reserve.
- Fans can `sell` back to the curve at any time.
- Holding `unlockAt` coins unlocks the creator's posts in the app. Posting in the **holder room**
  (`sendMessage`) is gated on-chain.
- All lists (creators, holders, trades, posts, messages) are stored in contract storage and read
  through view functions, because BOT Chain's public RPC disables `eth_getLogs`.

> Note: posts are stored on-chain, so a technical user can read them from the contract directly.
> The app only shows post bodies to holders. Don't use posts for anything that must stay truly secret.

## Layout

```
app/                  Next.js pages: / (explore), /c/[handle] (creator), /launch
components/           UI
lib/                  chain config, ABI, wagmi, tx helper
contracts/            Hardhat project: CreatorCoin.sol, tests, deploy script
DESIGN.md             design system
```

## 1. Deploy the contract (testnet)

```bash
cd contracts
pnpm install
cp .env.example .env          # add DEPLOYER_PRIVATE_KEY (a wallet holding some tBOT)
pnpm test                     # 9 tests
pnpm deploy:testnet           # prints the CreatorCoin address
pnpm verify:testnet <address> <usdt> <treasury>   # publish source on BOTScan
```

Get tBOT and test USDT from https://faucet.botchain.ai/basic.

## 2. Run the app

```bash
pnpm install
cp .env.example .env.local    # set NEXT_PUBLIC_CREATORCOIN_ADDRESS
pnpm dev
```

## 3. Ship

Push to GitHub → import into Vercel → set `NEXT_PUBLIC_NETWORK=testnet` and
`NEXT_PUBLIC_CREATORCOIN_ADDRESS` → deploy. Then verify the contract on https://scan.bohr.life.

For mainnet: `pnpm deploy:mainnet`, then set `NEXT_PUBLIC_NETWORK=mainnet` and the new address.

## Local development without testnet funds

```bash
cd contracts && pnpm hardhat node                                  # terminal 1
cd contracts && pnpm hardhat run scripts/seed-local.ts --network localhost   # prints env vars
NEXT_PUBLIC_NETWORK=local NEXT_PUBLIC_CREATORCOIN_ADDRESS=… NEXT_PUBLIC_USDT_ADDRESS=… pnpm dev
```
