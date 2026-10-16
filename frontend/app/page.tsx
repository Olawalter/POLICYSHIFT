"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { configured, read } from "@/lib/chain";
import { SetupNotice } from "@/components/Ui";

export default function Overview() {
  const [info, setInfo] = useState<any>(null);
  const [policies, setPolicies] = useState<string[]>([]);
  const [cases, setCases] = useState<string[]>([]);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!configured()) return;
    (async () => {
      try { setInfo(await read("get_protocol_info")); setPolicies(await read("list_policies")); setCases(await read("list_cases")); }
      catch (e: any) { setErr(String(e?.message || e)); }
    })();
  }, []);
  return (
    <>
      <h1>Policy change adjudication</h1>
      <p className="muted">Track immutable policy versions, then ask three separate questions: did it materially change, which version governs an event, and was the event compliant.</p>
      {!configured() && <SetupNotice />}
      {err && <div className="banner bad">{err}</div>}
      {info && <div className="card"><strong>Protocol</strong> <span className="badge b-info">{info.protocol}</span> <span className="muted">digest scheme {info.digest_scheme}</span></div>}
      <div className="row">
        <div className="card"><h2>Policies ({policies.length})</h2>{policies.map((p) => <div key={p}><Link href={`/policies/${p}`}>{p}</Link></div>)}<p><Link href="/policies">Manage policies</Link></p></div>
        <div className="card"><h2>Cases ({cases.length})</h2>{cases.map((c) => <div key={c}><Link href={`/cases/${c}`}>{c}</Link></div>)}<p><Link href="/cases/new">Open a case</Link></p></div>
      </div>
    </>
  );
}
