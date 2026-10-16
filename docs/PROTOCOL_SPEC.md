# POLICYSHIFT Protocol Spec (policyshift/1)

POLICYSHIFT answers three separate questions about a policy change and an event:
1. **Change** - is the new version materially different from the old one, under criteria frozen *before* evidence?
2. **Applicability** - which version governs the event? The newest version is never assumed to apply.
3. **Compliance** - did the event comply with the version that governs it?

## Lineage
- A policy has an ordered chain of versions. `register_version` requires `predecessor == current head`, so lineage is append-only; nothing is edited or reordered.
- Each version commits `source_url`, `content_digest` (sha256 of the raw response bytes, scheme `raw-sha256-v1`), `published_at`, `effective_at` (UTC ISO-8601 `YYYY-MM-DDTHH:MM:SSZ`).
- `published_at` may not precede the predecessor's. `effective_at` is a *declaration*, not proof.
- A case compares two versions with `old.ordinal < new.ordinal`.

## Case lifecycle (application states)
`DRAFT -> EVIDENCE_PENDING -> READY_FOR_ADJUDICATION -> CHANGE_ASSESSED -> APPLICABILITY_ASSESSED -> COMPLETED`
plus terminal `PROTOCOL_DEVIATION` (owner-declared, procedural; never produced by a model).

| Transition | Method | Who |
|---|---|---|
| open (DRAFT) | `open_case` | anyone (becomes case owner) |
| edit criteria | `set_criteria` | owner, DRAFT only |
| freeze | `freeze_case` | owner; stores sha256(criteria_text); evidence now allowed |
| evidence | `add_evidence` | owner, EVIDENCE_PENDING only, max 6 |
| ready | `mark_ready` | owner; evidence now closed |
| assess | `assess_change`, `assess_applicability`, `assess_compliance` | case owner or policy owner, strictly in order |
| inconclusive close | `close_inconclusive` | only when applicability is INCONCLUSIVE |
| deviation | `declare_protocol_deviation` | owner, any non-terminal state |

Supplementing evidence after READY is not supported. Open a new case with `supersedes=<old case id>`; the old case stays immutable.

## Results
- change: `MATERIAL_CHANGE | NO_MATERIAL_CHANGE | INCONCLUSIVE`
- applicability: `APPLIES` (NEW governs) `| DOES_NOT_APPLY` (OLD governs) `| INCONCLUSIVE`
- compliance: `COMPLIANT | NON_COMPLIANT | INCONCLUSIVE`
- A retrieval failure, digest mismatch on a required source, or malformed model output **raises an error and leaves state unchanged**. It never becomes a verdict, and never `NON_COMPLIANT`.

## Two kinds of status (do not conflate)
- **Application status** - stored in the contract (`status` above), deterministic, set only by a successfully executed transaction.
- **Native GenLayer transaction status** (e.g. pending, proposing, committing, revealing, ACCEPTED, FINALIZED, UNDETERMINED, CANCELED) - chain data read from the transaction receipt via the client. The contract cannot observe it and does not store it. The UI shows both in separate panels. An application state reached via an ACCEPTED transaction can still be appealed before FINALIZED.

## Out of scope in v1
Bonds, staking and payouts (bond-free); on-chain timestamps (the event time is a frozen, owner-declared input with stated provenance); cross-policy references.
