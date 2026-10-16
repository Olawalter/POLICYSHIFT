"use client";
import { useCallback, useState } from "react";
import { addPending, removePending } from "./pending";
import { submit, waitFor } from "./chain";

export interface TxState {
  label: string; hash: string; phase: "idle" | "signing" | "submitted" | "accepted" | "finalized" | "error";
  error: string; receipt: unknown;
}
const idle: TxState = { label: "", hash: "", phase: "idle", error: "", receipt: null };

export function useTx(account: string, onAccepted?: () => void) {
  const [tx, setTx] = useState<TxState>(idle);
  const run = useCallback(async (label: string, fn: string, args: unknown[]) => {
    setTx({ ...idle, label, phase: "signing" });
    let hash = "";
    try {
      hash = await submit(account, fn, args);
      addPending({ hash, label, at: new Date().toISOString() });
      setTx({ ...idle, label, hash, phase: "submitted" });
      const accepted = await waitFor(hash, "ACCEPTED", account);
      setTx({ label, hash, phase: "accepted", error: "", receipt: accepted });
      onAccepted?.();
      const fin = await waitFor(hash, "FINALIZED", account);
      setTx({ label, hash, phase: "finalized", error: "", receipt: fin });
      removePending(hash);
      onAccepted?.();
    } catch (e: any) {
      // Never auto-resubmit. The hash (if any) stays in pending storage for manual inspection.
      setTx((s) => ({ ...s, label, hash, phase: "error", error: String(e?.message || e) }));
    }
  }, [account, onAccepted]);
  return { tx, run, reset: () => setTx(idle) };
}
