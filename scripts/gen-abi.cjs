const fs = require("fs");
const path = require("path");

const { abi } = require("../contracts/artifacts/contracts/CreatorCoin.sol/CreatorCoin.json");
const target = path.join(__dirname, "../lib/abi.ts");
const src = fs.readFileSync(target, "utf8");
const tail = src.slice(src.indexOf("export const erc20Abi"));
fs.writeFileSync(
  target,
  "// Generated from contracts/artifacts — run `pnpm abi` after changing the contract.\n" +
    `export const creatorCoinAbi = ${JSON.stringify(abi, null, 2)} as const;\n\n` +
    tail,
);
console.log("lib/abi.ts updated");
