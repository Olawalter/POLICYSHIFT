"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { configured, read } from "@/lib/chain";
import { useTx } from "@/lib/useTx";
import { useWallet } from "@/components/Wallet";
import { Field, TxPanel } from "@/components/Ui";
import type { Policy } from "@/lib/types";
import { checkDigest, checkId, checkTs, checkUrl, firstError, nowUtc } from "@/lib/validate";
import { digestOfFile, digestOfUrl } from "@/lib/digest";

export default function PolicyPage() {
  const { id } = useParams<{ id: string }>();
  const { account, networkOk } = useWallet();
  const [p, setP] = useState<Policy | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [f, setF] = useState({ vid: "", url: "", digest: "", pub: "", eff: "" });
  const [dErr, setDErr] = useState("");
  const load = useCallback(async () => {
    try { setP(await read<Policy>("get_policy", [id])); setLoadErr(""); } catch (e: any) { setLoadErr(String(e?.message || e)); }
  }, [id]);
  const { tx, run } = useTx(account, load);
  useEffect(() => { if (configured()) load(); }, [load]);
  const head = p?.head_version ?? "";
  const err = firstError(checkId(f.vid, "Version id"), checkUrl(f.url, "Source URL"), checkDigest(f.digest, "Digest"), checkTs(f.pub, "Published at"), checkTs(f.eff, "Effective at"));
  const isOwner = !!p && account.toLowerCase() === p.owner.toLowerCase();
  return (
    <>
      <h1>{p?.name ?? id}</h1>
      <p className="muted">{p?.scope}</p>
      {loadErr && <div className="banner bad">{loadErr}</div>}
      <h2>Lineage (append-only)</h2>
      {p?.versions.map((v) => (
        <div key={v.version_id} className="card">
          <strong>{v.ordinal}. {v.version_id}</strong> {v.version_id === head && <span className="badge b-info">head</span>}
          <div className="muted">predecessor: {v.predecessor || "none"} · published {v.published_at} · declared effective {v.effective_at}</div>
          <div className="mono">{v.source_url}</div><div className="mono">sha256 {v.content_digest}</div>
        </div>
      ))}
      <h2>Register next version</h2>
      {!isOwner && <div className="banner">Only the policy owner can register versions.</div>}
      <div className="card">
        <div className="muted">Predecessor is fixed to the current head: <code>{head || "(none, first version)"}</code></div>
        <Field label="Version id" value={f.vid} onChange={(v) => setF({ ...f, vid: v })} />
        <Field label="Source URL (immutable https URL)" value={f.url} onChange={(v) => setF({ ...f, url: v })} />
        <Field label="Content digest (sha256 of raw bytes)" value={f.digest} onChange={(v) => setF({ ...f, digest: v })} />
        <div className="row">
          <button className="secondary" onClick={async () => { setDErr(""); try { setF({ ...f, digest: await digestOfUrl(f.url) }); } catch (e: any) { setDErr(`Could not fetch (CORS or HTTP): ${e.message}. Use a file instead.`); } }}>Compute from URL</button>
          <input type="file" onChange={async (e) => { const file = e.target.files?.[0]; if (file) setF({ ...f, digest: await digestOfFile(file) }); }} />
        </div>
        {dErr && <div className="err">{dErr}</div>}
        <div className="row">
          <Field label="Published at (UTC)" value={f.pub} onChange={(v) => setF({ ...f, pub: v })} placeholder="2026-02-01T00:00:00Z" />
          <Field label="Declared effective at (UTC)" value={f.eff} onChange={(v) => setF({ ...f, eff: v })} placeholder="2026-03-01T00:00:00Z" />
        </div>
        <button className="secondary" onClick={() => setF({ ...f, pub: nowUtc() })}>Published = now</button>
        {err && f.vid && <div className="err">{err}</div>}
        <p><button disabled={!isOwner || !networkOk || !!err} onClick={() => run(`register version ${f.vid}`, "register_version", [id, f.vid, head, f.url, f.digest, f.pub, f.eff])}>Register version</button></p>
      </div>
      <TxPanel tx={tx} />
    </>
  );
}
