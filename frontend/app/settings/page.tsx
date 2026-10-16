"use client";
import { ADDRESS, NETWORK_NAME, chain, configured } from "@/lib/chain";
import { loadPending, savePending } from "@/lib/pending";
import { useState } from "react";

export default function Settings() {
  const [pending, setPending] = useState(() => (typeof window !== "undefined" ? loadPending() : []));
  return (
    <>
      <h1>Settings</h1>
      <div className="card">
        <div>Network: <strong>{NETWORK_NAME}</strong> (chain id {(chain as any).id})</div>
        <div>Contract: {configured() ? <span className="mono">{ADDRESS}</span> : <span className="badge b-warn">not configured</span>}</div>
        <p className="muted">Both values are build-time environment variables (see .env.example). The app never invents an address.</p>
      </div>
      <div className="card">
        <strong>Unfinished transactions on this device</strong>
        {pending.length === 0 ? <p className="muted">None.</p> : pending.map((p) => <div key={p.hash} className="mono">{p.label} · {p.hash} · {p.at}</div>)}
        {pending.length > 0 && <button className="secondary" onClick={() => { savePending([]); setPending([]); }}>Clear list (does not cancel anything)</button>}
      </div>
    </>
  );
}
