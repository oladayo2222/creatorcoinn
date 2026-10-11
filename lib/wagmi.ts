import { cookieStorage, createConfig, createStorage, http, injected } from "wagmi";
import { activeChain } from "./chains";

export const wagmiConfig = createConfig({
  chains: [activeChain],
  connectors: [injected()],
  transports: { [activeChain.id]: http() } as Record<number, ReturnType<typeof http>>,
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
