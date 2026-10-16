"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { configured, read } from "@/lib/chain";
import { useTx } from "@/lib/useTx";
import { useWallet } from "@/components/Wallet";
import { Field, SetupNotice, TxPanel } from "@/components/Ui";
import type { Policy } from "@/lib/types";
import { checkId, checkLen, checkTs, firstError } from "@/lib/validate";

export default function NewCase() {
  const router = useRouter();
  const { account, networkOk } = useWallet();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [f, setF] = useState({ id: "", policy: "", oldV: "", newV: "", desc: "", ts: "", prov: "", criteria: "", indep: false, supersedes: "" });
  const { tx, run } = useTx(account, () => router.push(`/cases/${f.id}`));
  useEffect(() => {
    if (!configured()) return;
    read<string[]>("list_policies").then((ids) => Promise.all(ids.map((i) => read<Policy>("get_policy", [i])))).then(setPolicies).catch(() => {});
  }, []);
  const pol = policies.find((p) => p.policy_id === f.policy);
  const err = firstError(checkId(f.id, "Case id"), f.policy ? "" : "Choose a policy", f.oldV && f.newV && f.oldV !== f.newV ? "" : "Choose two different versions (old before new)",
    checkLen(f.desc, "Event description", 10, 1000), checkTs(f.ts, "Event timestamp"), checkLen(f.prov, "Event provenance", 3, 300), checkLen(f.criteria, "Criteria", 20, 4000),
    f.supersedes ? checkId(f.supersedes, "Supersedes") : "");
  const ordOld = pol?.versions.find((v) => v.version_id === f.oldV)?.ordinal ?? 0;
  const ordNew = pol?.versions.find((v) => v.version_id === f.newV)?.ordinal ?? 0;
  const order = f.oldV && f.newV && ordOld >= ordNew ? "Old version must precede new version" : "";
  return (
    <>
      <h1>Open a case</h1>
      {!configured() && <SetupNotice />}
      <div className="card">
        <Field label="Case id" value={f.id} onChange={(v) => setF({ ...f, id: v })} />
        <label>Policy</label>
        <select value={f.policy} onChange={(e) => setF({ ...f, policy: e.target.value, oldV: "", newV: "" })}><option value="">choose…</option>{policies.map((p) => <option key={p.policy_id}>{p.policy_id}</option>)}</select>
        <div className="row">
          <div><label>Old version</label><select value={f.oldV} onChange={(e) => setF({ ...f, oldV: e.target.value })}><option value="">choose…</option>{pol?.versions.map((v) => <option key={v.version_id}>{v.version_id}</option>)}</select></div>
          <div><label>New version</label><select value={f.newV} onChange={(e) => setF({ ...f, newV: e.target.value })}><option value="">choose…</option>{pol?.versions.map((v) => <option key={v.version_id}>{v.version_id}</option>)}</select></div>
        </div>
        <Field label="Event description (frozen once the case is opened)" area value={f.desc} onChange={(v) => setF({ ...f, desc: v })} />
        <div className="row">
          <Field label="Event timestamp (UTC)" value={f.ts} onChange={(v) => setF({ ...f, ts: v })} placeholder="2026-02-10T09:00:00Z" />
          <Field label="Event provenance" value={f.prov} onChange={(v) => setF({ ...f, prov: v })} placeholder="e.g. ops ticket export" />
        </div>
        <Field label="Criteria (can be edited until you freeze, then locked and hashed)" area value={f.criteria} onChange={(v) => setF({ ...f, criteria: v })} />
        <label><input type="checkbox" style={{ width: "auto" }} checked={f.indep} onChange={(e) => setF({ ...f, indep: e.target.checked })} /> Require independent evidence of the effective date (otherwise a declared date may be used)</label>
        <Field label="Supersedes case id (optional)" value={f.supersedes} onChange={(v) => setF({ ...f, supersedes: v })} />
        {(err || order) && f.id && <div className="err">{err || order}</div>}
        <p><button disabled={!account || !networkOk || !!err || !!order || !configured()} onClick={() => run(`open case ${f.id}`, "open_case", [f.id, f.policy, f.oldV, f.newV, f.desc, f.ts, f.prov, f.criteria, f.indep, f.supersedes])}>Open case</button></p>
      </div>
      <TxPanel tx={tx} />
    </>
  );
}
