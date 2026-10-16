"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { configured, read } from "@/lib/chain";
import { useTx } from "@/lib/useTx";
import { useWallet } from "@/components/Wallet";
import { Field, SetupNotice, TxPanel } from "@/components/Ui";
import { checkId, checkLen, firstError } from "@/lib/validate";

export default function Policies() {
  const { account, networkOk } = useWallet();
  const [ids, setIds] = useState<string[]>([]);
  const [f, setF] = useState({ id: "", name: "", scope: "" });
  const load = useCallback(async () => { if (configured()) setIds(await read<string[]>("list_policies")); }, []);
  const { tx, run } = useTx(account, load);
  useEffect(() => { load().catch(() => {}); }, [load]);
  const err = firstError(checkId(f.id, "Policy id"), checkLen(f.name, "Name", 1, 120), checkLen(f.scope, "Scope", 1, 400));
  return (
    <>
      <h1>Policies</h1>
      {!configured() && <SetupNotice />}
      {ids.map((i) => <div key={i} className="card"><Link href={`/policies/${i}`}>{i}</Link></div>)}
      <h2>Register a policy</h2>
      <div className="card">
        <Field label="Policy id" value={f.id} onChange={(v) => setF({ ...f, id: v })} placeholder="access-policy" />
        <Field label="Name" value={f.name} onChange={(v) => setF({ ...f, name: v })} />
        <Field label="Scope" area value={f.scope} onChange={(v) => setF({ ...f, scope: v })} />
        {err && f.id && <div className="err">{err}</div>}
        <p><button disabled={!account || !networkOk || !!err || !configured()} onClick={() => run(`register policy ${f.id}`, "register_policy", [f.id, f.name, f.scope])}>Register</button></p>
      </div>
      <TxPanel tx={tx} />
    </>
  );
}
