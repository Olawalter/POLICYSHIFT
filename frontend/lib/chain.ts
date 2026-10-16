// THE ONLY FILE THAT TOUCHES genlayer-js. Call shapes follow public genlayer-js examples and have NOT been
// type-checked in the authoring environment (no registry access). Run `npm run typecheck` and adjust here.
import { createClient } from "genlayer-js";
import { studionet, localnet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

export const ADDRESS = (process.env.NEXT_PUBLIC_POLICYSHIFT_ADDRESS || "").trim();
export const NETWORK_NAME = (process.env.NEXT_PUBLIC_GENLAYER_NETWORK || "studionet").trim();
export const chain = NETWORK_NAME === "localnet" ? localnet : studionet;

type Eth = { request: (a: { method: string; params?: unknown[] }) => Promise<any> };
const eth = (): Eth | undefined => (typeof window !== "undefined" ? (window as any).ethereum : undefined);

export const hasWallet = () => !!eth();
export const configured = () => /^0x[0-9a-fA-F]{40}$/.test(ADDRESS);

export async function connectWallet(): Promise<string> {
  const e = eth();
  if (!e) throw new Error("No injected wallet found");
  const accts = await e.request({ method: "eth_requestAccounts" });
  return accts[0];
}
export async function walletChainId(): Promise<number | null> {
  const e = eth();
  if (!e) return null;
  return parseInt(await e.request({ method: "eth_chainId" }), 16);
}
export async function isCorrectNetwork(): Promise<boolean> {
  const id = await walletChainId();
  return id !== null && id === (chain as any).id;
}

function readClient() { return createClient({ chain }); }
function writeClient(account: string) { return createClient({ chain, account: account as `0x${string}` }); }

export async function read<T = unknown>(fn: string, args: unknown[] = []): Promise<T> {
  if (!configured()) throw new Error("Contract address is not configured");
  const raw = await readClient().readContract({ address: ADDRESS as `0x${string}`, functionName: fn, args: args as any });
  return (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
}

export async function submit(account: string, fn: string, args: unknown[]): Promise<string> {
  if (!configured()) throw new Error("Contract address is not configured");
  if (!(await isCorrectNetwork())) throw new Error("Wallet is on the wrong network");
  const hash = await writeClient(account).writeContract({
    address: ADDRESS as `0x${string}`, functionName: fn, args: args as any, value: 0n,
  });
  return hash as string;
}

export type NativeStage = "ACCEPTED" | "FINALIZED";
export async function waitFor(hash: string, stage: NativeStage, account?: string) {
  const client = account ? writeClient(account) : readClient();
  return client.waitForTransactionReceipt({
    hash: hash as any,
    status: stage === "ACCEPTED" ? TransactionStatus.ACCEPTED : TransactionStatus.FINALIZED,
    retries: 120, interval: 5000,
  } as any);
}
