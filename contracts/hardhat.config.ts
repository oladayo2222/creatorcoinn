import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "dotenv/config";

// MetaMask exports keys without the 0x prefix; accept either form.
const rawKey = process.env.DEPLOYER_PRIVATE_KEY?.trim();
const accounts = rawKey ? [rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 }, viaIR: true },
  },
  networks: {
    botTestnet: { url: "https://rpc.bohr.life", chainId: 968, accounts },
    botMainnet: { url: "https://rpc.botchain.ai", chainId: 677, accounts },
  },
  // BOTScan runs Blockscout, which accepts Etherscan-style verification without a real API key.
  etherscan: {
    apiKey: { botTestnet: "blockscout", botMainnet: "blockscout" },
    customChains: [
      {
        network: "botTestnet",
        chainId: 968,
        urls: { apiURL: "https://scan.bohr.life/api", browserURL: "https://scan.bohr.life" },
      },
      {
        network: "botMainnet",
        chainId: 677,
        urls: { apiURL: "https://scan.botchain.ai/api", browserURL: "https://scan.botchain.ai" },
      },
    ],
  },
  sourcify: { enabled: false },
};

export default config;
