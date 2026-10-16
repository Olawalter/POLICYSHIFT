"use client";
import React from "react";
import type { Assessment, AppStatus } from "@/lib/types";
import { STATUS_ORDER } from "@/lib/types";
import type { TxState } from "@/lib/useTx";

export function ResultBadge({ result }: { result?: string }) {
  if (!result) return <span className="badge">not assessed</span>;
  const cls = result === "INCONCLUSIVE" ? "b-warn" : result === "NON_COMPLIANT" || result === "MATERIAL_CHANGE" ? "b-bad" : result === "COMPLIANT" || result === "NO_MATERIAL_CHANGE" ? "b-ok" : "b-info";
  return <span className={"badge " + cls}>{result}</span>;
}

export function Stepper({ status }: { status: AppStatus }) {
  if (status === "PROTOCOL_DEVIATION") return <div className="banner bad">Protocol deviation declared - terminal state.</div>;
  const idx = STATUS_ORDER.indexOf(status);
  return (
    <div className="stepper" aria-label="application status">
      {STATUS_ORDER.map((s, i) => <span key={s} className={"step " + (i < idx || status === "COMPLETED" ? "done" : i === idx ? "now" : "")}>{s.replaceAll("_", " ")}</span>)}
    </div>
  );
}

export function TxPanel({ tx }: { tx: TxState }) {
  if (tx.phase === "idle") return null;
  const label = { signing: "Waiting for wallet signature", submitted: "Submitted; waiting for ACCEPTED", accepted: "ACCEPTED; waiting for FINALIZED (still appealable)", finalized: "FINALIZED", error: "Failed" }[tx.phase];
  return (
    <div className={"card"} role="status">
      <strong>Native transaction status</strong> <span className={"badge " + (tx.phase === "error" ? "b-bad" : tx.phase === "finalized" ? "b-ok" : "b-warn")}>{label}</span>
      <div className="muted">{tx.label}</div>
      {tx.hash && <div className="mono">tx {tx.hash}</div>}
      {tx.error && <div className="err">{tx.error}</div>}
      <p className="muted" style={{ fontSize: 12 }}>This is chain status, separate from the application status of the case. The case view refreshes after each stage; a failed transaction is never retried automatically.</p>
    </div>
  );
}

export function Field(props: { label: string; value: string; onChange: (v: string) => void; area?: boolean; placeholder?: string; error?: string }) {
  const common = { value: props.value, placeholder: props.placeholder, onChange: (e: React.ChangeEvent<any>) => props.onChange(e.target.value) };
  return (
    <div>
      <label>{props.label}</label>
      {props.area ? <textarea {...common} /> : <input {...common} />}
      {props.error && <div className="err">{props.error}</div>}
    </div>
  );
}

export function AssessmentCard({ title, a }: { title: string; a: Assessment | null }) {
  return (
    <div className="card">
      <strong>{title}</strong> <ResultBadge result={a?.result} />
      {a && (
        <>
          {a.applicable_version && a.applicable_version !== "NONE" && <div>Governing version: <strong>{a.applicable_version}</strong></div>}
          {a.effective_date_support && <div className="muted">Effective-date support: {a.effective_date_support}</div>}
          {a.result === "INCONCLUSIVE" && <div className="muted">INCONCLUSIVE is not a verdict: the evidence did not support a definitive answer.</div>}
          {a.rationale && <p>{a.rationale}</p>}
          {a.changes?.map((c, i) => (
            <div key={i}><span className="badge">{c.category}</span> {c.rationale}
              {c.old_quote && <blockquote>old: “{c.old_quote}”</blockquote>}
              {c.new_quote && <blockquote>new: “{c.new_quote}”</blockquote>}</div>
          ))}
          {a.clauses?.map((c, i) => <blockquote key={i}><span className="badge">{c.role}</span> “{c.quote}”</blockquote>)}
          {a.retroactivity_quote && <blockquote>retroactivity: “{a.retroactivity_quote}”</blockquote>}
          {a.transition_quote && <blockquote>transition: “{a.transition_quote}”</blockquote>}
          {!!a.unavailable?.length && <div className="err">Unavailable evidence: {a.unavailable.join(", ")}</div>}
          {a.limitations?.map((l, i) => <div key={i} className="muted">Limitation: {l}</div>)}
        </>
      )}
    </div>
  );
}

export function SetupNotice() {
  return <div className="banner">No contract address configured. Deploy PolicyShift, then set NEXT_PUBLIC_POLICYSHIFT_ADDRESS (see README). Nothing is shown as deployed until you do.</div>;
}
