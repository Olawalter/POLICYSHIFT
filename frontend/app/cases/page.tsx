"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { configured, read } from "@/lib/chain";
import { SetupNotice } from "@/components/Ui";
import type { CaseView } from "@/lib/types";

export default function Cases() {
  const [cases, setCases] = useState<CaseView[]>([]);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!configured()) return;
    (async () => {
      try {
        const ids = await read<string[]>("list_cases");
        setCases(await Promise.all(ids.map((i) => read<CaseView>("get_case", [i]))));
      } catch (e: any) { setErr(String(e?.message || e)); }
    })();
  }, []);
  return (
    <>
      <h1>Cases</h1>
      {!configured() && <SetupNotice />}
      {err && <div className="banner bad">{err}</div>}
      {cases.map((c) => (
        <div key={c.case_id} className="card">
          <Link href={`/cases/${c.case_id}`}><strong>{c.case_id}</strong></Link> <span className="badge b-info">{c.status}</span>
          <div className="muted">{c.policy_id}: {c.old_version_id} → {c.new_version_id} · event {c.event_timestamp}</div>
        </div>
      ))}
      <p><Link href="/cases/new">Open a new case</Link></p>
    </>
  );
}
