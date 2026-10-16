// Pending transaction hashes survive reloads. Nothing here resubmits anything.
const KEY = "policyshift.pendingTx.v1";
export interface PendingTx { hash: string; label: string; at: string; }
export function loadPending(): PendingTx[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
export function savePending(list: PendingTx[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(-20))); } catch { /* storage may be unavailable */ }
}
export function addPending(tx: PendingTx) { savePending([...loadPending(), tx]); }
export function removePending(hash: string) { savePending(loadPending().filter((t) => t.hash !== hash)); }
