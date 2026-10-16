# Contract Spec - `contracts/policyshift.py` (class `PolicyShift`)

Single authoritative contract. First line pins the runner (`# { "Depends": "py-genlayer:<hash>" }`). **The hash currently in the file was copied from public boilerplate excerpts and MUST be checked against the official boilerplate/`genvm-lint` before deployment.**

## Storage
`TreeMap`s: `policies`, `versions` (key `policy/version`), `cases`, `evidence` (key `case/evidence`), `evidence_fingerprints` (key `case|digest|url`); `DynArray[str]`: `policy_index`, `case_index`. Records are `@allow_storage @dataclass` with `str`, `Address`, `u32`, `bool` fields. Bounded lists are stored as comma-joined ids (max 6 evidence). No floats, no unbounded containers.

## Writes
`register_policy`, `register_version`, `open_case`, `set_criteria`, `freeze_case`, `add_evidence`, `mark_ready`, `declare_protocol_deviation`, `assess_change`, `assess_applicability`, `assess_compliance`, `close_inconclusive`.

## Views (all return JSON strings)
`get_protocol_info`, `list_policies`, `list_cases`, `get_policy`, `get_case`, `get_receipt`.

## Errors (prefixes follow the official GenLayer convention)
`[EXPECTED]` input/state/authorization problems; `[EXTERNAL]` HTTP status, digest mismatch, empty/oversized body; `[TRANSIENT]` fetch exceptions; `[LLM_ERROR]` malformed or self-check-failing model output.

## Input validation
Ids `[A-Za-z0-9][A-Za-z0-9._-]{0,63}`; https URLs <= 512 chars, no userinfo, no localhost/private ranges; digests 64 lowercase hex; timestamps exact UTC form; text fields length-bounded (criteria 20-4000, event 10-1000).

## Non-deterministic design
Each assessment is a `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)`. See `VERIFICATION_DESIGN.md`. The contract mutates state only after the block returns, so a rejected/erroring assessment changes nothing.

## Known unverified points (to confirm with `genvm-lint` and Studio)
1. Runner hash in the header line.
2. `hashlib`, `re`, `json` availability inside GenVM (expected, unverified here).
3. Exact `gl.nondet.web.get` response fields (`status`, `body`) - code reads them defensively.
4. `gl.nondet.exec_prompt` return shape - code accepts a dict or a string with JSON.
5. `Address.as_hex` for JSON views.
6. Whether assigning a constructed dataclass into a `TreeMap` and mutating it afterwards behaves as in the docs examples.
