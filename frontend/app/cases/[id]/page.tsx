"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { configured, read } from "@/lib/chain";
import { useTx } from "@/lib/useTx";
import { useWallet } from "@/components/Wallet";
import { AssessmentCard, Field, ResultBadge, Stepper, TxPanel } from "@/components/Ui";
import type { CaseView } from "@/lib/types";
import { checkDigest, checkId, checkTs, checkUrl, firstError, nowUtc } from "@/lib/validate";
import { digestOfFile, digestOfUrl, digestOfText } from "@/lib/digest";
import { loadPending } from "@/lib/pending";

const KINDS = ["PUBLICATION", "EFFECTIVE_DATE", "EVENT", "OTHER"];

export default function CasePage() {
  const { id } = useParams<{ id: string }>();
  const { account, networkOk } = useWallet();
  const [c, setC] = useState<CaseView | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [criteria, setCriteria] = useState("");
  const [ev, setEv] = useState({ id: "", kind: "EFFECTIVE_DATE", url: "", digest: "", ctype: "text/plain", obs: "", pub: "", lim: "" });
  const [dErr, setDErr] = useState("");
  const [devReason, setDevReason] = useState("");
  const load = useCallback(async () => {
    try { const v = await read<CaseView>("get_case", [id]); setC(v); setCriteria((cur) => cur || v.criteria_text); setLoadErr(""); }
    catch (e: any) { setLoadErr(String(e?.message || e)); }
  }, [id]);
  const { tx, run } = useTx(account, load);
  useEffect(() => { if (configured()) load(); }, [load]);

  const isOwner = !!c && account.toLowerCase() === c.owner.toLowerCase();
  const canWrite = isOwner && networkOk && tx.phase !== "signing" && tx.phase !== "submitted";
  const evErr = firstError(checkId(ev.id, "Evidence id"), checkUrl(ev.url, "URL"), checkDigest(ev.digest, "Digest"), checkTs(ev.obs, "Observed at"), checkTs(ev.pub, "Source published at", true));
  const pendingHere = typeof window !== "undefined" ? loadPending() : [];

  if (!configured()) return <div className="banner">No contract address configured.</div>;
  if (loadErr) return <div className="banner bad">{loadErr}</div>;
  if (!c) return <p className="muted">Loading…</p>;

  const s = c.status;
  const appl = c.applicability?.result;
  return (
    <>
      <h1>{c.case_id}</h1>
      <div className="muted">{c.policy_id}: {c.old_version_id} → {c.new_version_id} · owner <span className="mono">{c.owner}</span> {c.supersedes && <>· supersedes <Link href={`/cases/${c.supersedes}`}>{c.supersedes}</Link></>}</div>
      <Stepper status={s} />
      {!isOwner && <div className="banner">Read-only: connect the case owner’s wallet to act. (The policy owner may also trigger assessments in the contract.)</div>}
      {pendingHere.length > 0 && <div className="muted" style={{ fontSize: 12 }}>Unfinished transactions on this device: {pendingHere.map((p) => p.hash.slice(0, 10) + "…").join(", ")}</div>}

      <div className="card">
        <strong>Event (frozen)</strong>
        <div>{c.event_description}</div>
        <div className="muted">time {c.event_timestamp} · provenance: {c.event_provenance}</div>
        <div className="muted">Independent effective-date evidence required: {String(c.require_independent_effective_date)}</div>
      </div>

      <div className="card">
        <strong>Criteria</strong> {c.criteria_digest ? <span className="badge b-ok">frozen</span> : <span className="badge b-warn">editable</span>}
        {s === "DRAFT" ? <><textarea value={criteria} onChange={(e) => setCriteria(e.target.value)} />
          <p className="row" style={{ gap: 8 }}>
            <button className="secondary" disabled={!canWrite} onClick={() => run("update criteria", "set_criteria", [id, criteria])}>Save criteria</button>
            <button disabled={!canWrite} onClick={() => run("freeze criteria", "freeze_case", [id])}>Freeze criteria (hash + open evidence)</button></p></>
          : <><p style={{ whiteSpace: "pre-wrap" }}>{c.criteria_text}</p><div className="mono">sha256 {c.criteria_digest}</div></>}
      </div>

      <div className="card">
        <strong>Evidence ({c.evidence.length}/6)</strong>
        {c.evidence.map((e) => <div key={e.id} style={{ marginTop: 8 }}><span className="badge">{e.kind}</span> <strong>{e.id}</strong> <span className="muted">observed {e.observed_at}</span><div className="mono">{e.url}</div><div className="mono">sha256 {e.digest}</div>{e.limitations && <div className="muted">limitations: {e.limitations}</div>}</div>)}
        {s === "EVIDENCE_PENDING" && (
          <>
            <h2>Add evidence</h2>
            <div className="row"><Field label="Evidence id" value={ev.id} onChange={(v) => setEv({ ...ev, id: v })} />
              <div><label>Kind</label><select value={ev.kind} onChange={(e) => setEv({ ...ev, kind: e.target.value })}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select></div></div>
            <Field label="Source URL (immutable https)" value={ev.url} onChange={(v) => setEv({ ...ev, url: v })} />
            <Field label="Digest (sha256 of raw bytes)" value={ev.digest} onChange={(v) => setEv({ ...ev, digest: v })} />
            <div className="row">
              <button className="secondary" onClick={async () => { setDErr(""); try { setEv({ ...ev, digest: await digestOfUrl(ev.url) }); } catch (e: any) { setDErr(`Could not fetch: ${e.message}. Use a file.`); } }}>Compute from URL</button>
              <input type="file" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setEv({ ...ev, digest: await digestOfFile(f), ctype: f.type || ev.ctype }); }} />
            </div>
            {dErr && <div className="err">{dErr}</div>}
            <div className="row"><Field label="Observed at (UTC)" value={ev.obs} onChange={(v) => setEv({ ...ev, obs: v })} placeholder="2026-02-02T00:00:00Z" />
              <Field label="Source published at (UTC, optional)" value={ev.pub} onChange={(v) => setEv({ ...ev, pub: v })} /></div>
            <button className="secondary" onClick={() => setEv({ ...ev, obs: nowUtc() })}>Observed = now</button>
            <Field label="Limitations (optional, max 300)" value={ev.lim} onChange={(v) => setEv({ ...ev, lim: v })} />
            {evErr && ev.id && <div className="err">{evErr}</div>}
            <p className="row" style={{ gap: 8 }}>
              <button disabled={!canWrite || !!evErr || c.evidence.length >= 6} onClick={() => run(`add evidence ${ev.id}`, "add_evidence", [id, ev.id, ev.kind, ev.url, ev.digest, ev.ctype, ev.obs, ev.pub, "raw-sha256-v1", ev.lim])}>Add evidence</button>
              <button disabled={!canWrite} onClick={() => run("mark ready (closes evidence)", "mark_ready", [id])}>Close evidence and mark ready</button></p>
          </>
        )}
      </div>

      <h2>Adjudication</h2>
      <p className="muted">Each step is a separate transaction. The leader proposes; independent validators re-fetch the sources, re-evaluate and verify quotes before the result is accepted.</p>
      <div className="row" style={{ gap: 8 }}>
        <button disabled={!canWrite || s !== "READY_FOR_ADJUDICATION"} onClick={() => run("assess change", "assess_change", [id])}>1. Assess change</button>
        <button disabled={!canWrite || s !== "CHANGE_ASSESSED"} onClick={() => run("assess applicability", "assess_applicability", [id])}>2. Assess applicability</button>
        {appl === "INCONCLUSIVE"
          ? <button disabled={!canWrite || s !== "APPLICABILITY_ASSESSED"} onClick={() => run("close as inconclusive", "close_inconclusive", [id])}>3. Close as inconclusive</button>
          : <button disabled={!canWrite || s !== "APPLICABILITY_ASSESSED"} onClick={() => run("assess compliance", "assess_compliance", [id])}>3. Assess compliance</button>}
      </div>
      <TxPanel tx={tx} />
      <AssessmentCard title="1. Change" a={c.change} />
      <AssessmentCard title="2. Applicability" a={c.applicability} />
      <AssessmentCard title="3. Compliance" a={c.compliance} />
      {s === "COMPLETED" && <p>Final: <ResultBadge result={c.compliance?.result} /> · <Link href={`/cases/${id}/receipt`}>View receipt</Link></p>}

      {s !== "COMPLETED" && s !== "PROTOCOL_DEVIATION" && isOwner && (
        <div className="card"><strong>Declare protocol deviation</strong> <span className="muted">(terminal; procedural, not an assessment)</span>
          <Field label="Reason" value={devReason} onChange={setDevReason} />
          <button className="secondary" disabled={!canWrite || devReason.trim().length < 5} onClick={() => run("declare protocol deviation", "declare_protocol_deviation", [id, devReason])}>Declare</button></div>
      )}
      {c.deviation_reason && <div className="banner bad">Deviation: {c.deviation_reason}</div>}
    </>
  );
}
