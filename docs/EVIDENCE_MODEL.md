# Evidence Model

## Sources of truth
- **Policy text**: the version record's `source_url` + `content_digest`. Retrieval is mandatory and digest-checked on every assessment.
- **Supporting evidence** (<= 6 per case): kinds `PUBLICATION`, `EFFECTIVE_DATE`, `EVENT`, `OTHER`.
- **Event**: description, timestamp, provenance string; frozen when the case is opened, so it cannot drift after seeing results.

## Evidence record fields
`evidence_id, kind, source_url, content_digest, content_type, observed_at, source_published_at (optional), extraction_version (= raw-sha256-v1), limitations, submitter`.

## Digest semantics
`content_digest = sha256(raw HTTP response body bytes)`. At assessment time every validator re-fetches the URL and recomputes the digest. Mismatch on a policy version => `[EXTERNAL]` error (no verdict). Mismatch or fetch failure on optional evidence => that evidence is marked **unavailable**, excluded from the prompt, listed in the result's `unavailable` field, and cannot support `EVIDENCE_SUPPORTED`.
Use immutable URLs (archive snapshots, commit-pinned raw files). Mutable pages will drift and fail the digest check - by design.

## Provenance vs truth
`observed_at` and `source_published_at` are claims by the submitter, not proofs. The protocol never treats a *declared* effective date as verified. Applicability results carry `effective_date_support`: `EVIDENCE_SUPPORTED` (cites evidence ids that exist and were retrievable), `DECLARED_ONLY`, `CONTRADICTED`, `MISSING`. If the frozen criteria set `require_independent_effective_date`, anything other than `EVIDENCE_SUPPORTED` forces `INCONCLUSIVE`.

## Integrity rules
Evidence is accepted only while `EVIDENCE_PENDING`; duplicates (same case, url and digest) and reused ids are rejected; evidence closes at `mark_ready`; frozen `criteria_digest` is echoed in every assessment result and checked by validators.

## Untrusted content
Source text is untrusted. Prompts delimit it (`<<<SOURCE ...>>>`), state that embedded instructions must be ignored, and every material claim must be backed by a verbatim quote that validators re-check against their own retrieved copy. Text is HTML-stripped, whitespace-collapsed, lowercased and truncated (6000 chars per version, 3000 per evidence item) before use. Truncation is a limitation: policies longer than the window are not fully analysed in v1.
