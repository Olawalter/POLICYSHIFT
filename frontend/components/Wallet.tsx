"use client";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { chain, connectWallet, hasWallet, isCorrectNetwork } from "@/lib/chain";

interface W { account: string; networkOk: boolean; connect: () => Promise<void>; error: string; }
const Ctx = createContext<W>({ account: "", networkOk: false, connect: async () => {}, error: "" });
export const useWallet = () => useContext(Ctx);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState("");
  const [networkOk, setNetworkOk] = useState(false);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => { try { setNetworkOk(await isCorrectNetwork()); } catch { setNetworkOk(false); } }, []);
  const connect = useCallback(async () => {
    setError("");
    try { setAccount(await connectWallet()); await refresh(); } catch (e: any) { setError(String(e?.message || e)); }
  }, [refresh]);
  useEffect(() => {
    const e = (window as any).ethereum;
    if (!e?.on) return;
    const onChain = () => refresh();
    const onAcc = (a: string[]) => setAccount(a[0] || "");
    e.on("chainChanged", onChain); e.on("accountsChanged", onAcc);
    return () => { e.removeListener?.("chainChanged", onChain); e.removeListener?.("accountsChanged", onAcc); };
  }, [refresh]);
  return <Ctx.Provider value={{ account, networkOk, connect, error }}>{children}</Ctx.Provider>;
}

export function WalletBar() {
  const { account, networkOk, connect, error } = useWallet();
  return (
    <div className="row" style={{ flex: "0 0 auto", alignItems: "center" }}>
      {account ? <span className="mono">{account.slice(0, 6)}…{account.slice(-4)}</span> : <button onClick={connect} disabled={!hasWallet()}>{hasWallet() ? "Connect wallet" : "No wallet found"}</button>}
      {account && <span className={"badge " + (networkOk ? "b-ok" : "b-bad")}>{networkOk ? "network ok" : `switch wallet to ${(chain as any).name ?? "configured network"}`}</span>}
      {error && <span className="err">{error}</span>}
    </div>
  );
}
