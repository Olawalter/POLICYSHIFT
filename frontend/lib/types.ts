export type AppStatus =
  | "DRAFT" | "EVIDENCE_PENDING" | "READY_FOR_ADJUDICATION" | "CHANGE_ASSESSED"
  | "APPLICABILITY_ASSESSED" | "COMPLETED" | "PROTOCOL_DEVIATION";

export const STATUS_ORDER: AppStatus[] = [
  "DRAFT", "EVIDENCE_PENDING", "READY_FOR_ADJUDICATION", "CHANGE_ASSESSED", "APPLICABILITY_ASSESSED", "COMPLETED",
];

export interface Version {
  version_id: string; predecessor: string; source_url: string; content_digest: string;
  published_at: string; effective_at: string; ordinal: number;
}
export interface Policy {
  policy_id: string; name: string; scope: string; owner: string; head_version: string; versions: Version[];
}
export interface Evidence {
  id: string; kind: string; url: string; digest: string; observed_at: string; published_at: string; limitations: string;
}
export interface Assessment {
  kind: string; result: string; rationale?: string; limitations?: string[]; unavailable?: string[];
  changes?: { category: string; old_quote: string; new_quote: string; rationale: string }[];
  categories?: string[]; applicable_version?: string; effective_date_support?: string;
  effective_evidence_ids?: string[]; retroactivity_quote?: string; transition_quote?: string;
  clauses?: { role: string; quote: string }[]; criteria_digest?: string; protocol?: string;
}
export interface CaseView {
  case_id: string; policy_id: string; old_version_id: string; new_version_id: string; supersedes: string;
  owner: string; event_description: string; event_timestamp: string; event_provenance: string;
  criteria_text: string; criteria_digest: string; require_independent_effective_date: boolean;
  status: AppStatus; deviation_reason: string; evidence: Evidence[];
  change: Assessment | null; applicability: Assessment | null; compliance: Assessment | null;
}
export interface Receipt {
  protocol: string; policy: { policy_id: string; name: string };
  old_version: { id: string; digest: string; effective_at: string };
  new_version: { id: string; digest: string; effective_at: string };
  case: CaseView;
}
