"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { configured, read } from "@/lib/chain";
import { AssessmentCard } from "@/components/Ui";
import type { Receipt } from "@/lib/types";

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const [r, setR] = useState<Receipt | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { if (configured()) read<Receipt>("get_receipt", [id]).then(setR).catch((e) => setErr(String(e?.message || e))); }, [id]);
  if (!configured()) return <div className="banner">No contract address configured.</div>;
  if (err) return <div className="banner bad">{err}</div>;
  if (!r) return <p className="muted">Loading…</p>;
  const download = () => {
    const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `policyshift-receipt-${id}.json`; a.click();
  };
  return (
    <>
      <h1>Receipt: {id}</h1>
      <p className="muted">Application-level record. Native transaction hashes and ACCEPTED/FINALIZED status come from the chain, not this record. <Link href={`/cases/${id}`}>Back to case</Link></p>
      <div className="card">
        <div>Protocol <strong>{r.protocol}</strong> · policy <strong>{r.policy.name}</strong></div>
        <div className="mono">old {r.old_version.id} sha256 {r.old_version.digest} (declared effective {r.old_version.effective_at})</div>
        <div className="mono">new {r.new_version.id} sha256 {r.new_version.digest} (declared effective {r.new_version.effective_at})</div>
        <div className="mono">criteria sha256 {r.case.criteria_digest}</div>
        <div>Event {r.case.event_timestamp}: {r.case.event_description}</div>
        <div className="muted">Evidence: {r.case.evidence.map((e) => `${e.id} (${e.kind}, ${e.digest.slice(0, 10)}…)`).join("; ") || "none"}</div>
      </div>
      <AssessmentCard title="Change" a={r.case.change} />
      <AssessmentCard title="Applicability" a={r.case.applicability} />
      <AssessmentCard title="Compliance" a={r.case.compliance} />
      <button onClick={download}>Download receipt JSON</button>
    </>
  );
}
