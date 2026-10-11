import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from "viem";

const MESSAGES: Record<string, string> = {
  AlreadyCreator: "This wallet already has a coin.",
  NotCreator: "Only the creator can do that.",
  InvalidHandle: "Handles are 3–20 characters: lowercase letters, numbers and underscores.",
  HandleTaken: "That handle is already taken.",
  InvalidName: "Names are 1–40 characters.",
  InvalidAmount: "Trade between 1 and 50 coins at a time.",
  InvalidUnlock: "Unlock threshold must be between 1 and 100 coins.",
  SlippageExceeded: "The price moved while you were signing. Check the new quote and try again.",
  InsufficientCoins: "You don't hold that many coins.",
  LastCoinLocked: "The creator's first coin can't be sold.",
  TooLong: "That's longer than the limit.",
  Empty: "Write something first.",
  Locked: "Hold enough coins to unlock this room.",
};

export function readableError(err: unknown): string {
  if (err instanceof BaseError) {
    if (err.walk((e) => e instanceof UserRejectedRequestError)) return "You cancelled the request in your wallet.";
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const name = revert.data?.errorName;
      if (name && MESSAGES[name]) return MESSAGES[name];
      if (revert.reason) return revert.reason;
    }
    if (/insufficient funds/i.test(err.message)) return "Not enough BOT in your wallet to pay for gas.";
    if (/transfer amount exceeds balance|exceeds balance/i.test(err.message)) return "Not enough USDT in your wallet.";
    return err.shortMessage;
  }
  return err instanceof Error ? err.message : "Something went wrong.";
}
