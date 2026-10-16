# Validator Verification Design (the main quality gate)

Equivalence mechanism: **custom leader/validator** via `gl.vm.run_nondet_unsafe`, chosen over `strict_eq` (wording differs between LLM runs) and over a bare principle-style comparison (which would only compare outputs). The validator re-derives the answer from the sources.

## Leader
1. Fetch both policy texts and the evidence, verifying sha256 digests.
2. Build a prompt with frozen criteria, untrusted-source delimiters, the event and a strict JSON schema.
3. Parse JSON, normalise enums and caps, apply deterministic coercions, then run `_verify` on its own output. Failure => `[LLM_ERROR]`.

## Validator (each independently)
1. If the leader errored, re-run the leader logic: expected/external errors are accepted only if the validator reproduces the same message; transient errors only if also transient; otherwise reject.
2. **Re-fetch and digest-check the sources itself** (never trusts the leader's text).
3. **Re-run the whole assessment with its own LLM call.**
4. `_verify` the **leader's** result against the **validator's own** sources: criteria digest equal; enum validity; internal consistency (e.g. result vs `applicable_version`); every cited quote exists in the validator's retrieved text; category list matches changes; evidence ids exist and were retrievable by the validator; temporal rules below.
5. `_agree`: compare **decision fields** only (`result`; for material change a non-empty category overlap; for applicability the `applicable_version`). Rationale wording may differ.

## Deterministic rules shared by leader and validators
- `MATERIAL_CHANGE` needs 1-6 changes, each with a verified quote from the relevant version.
- `APPLIES` for an event dated before the new version's declared effective date requires a verified retroactivity quote; `DOES_NOT_APPLY` for an event on/after it requires a verified transition quote. Otherwise the result is coerced to `INCONCLUSIVE`.
- `require_independent_effective_date` without `EVIDENCE_SUPPORTED` => `INCONCLUSIVE`; `CONTRADICTED`/`MISSING` support never yields a definitive result.
- `COMPLIANT`/`NON_COMPLIANT` needs >= 1 verified clause quote from the *governing* version; otherwise `INCONCLUSIVE`.
- The model cannot emit `PROTOCOL_DEVIATION`.

## Why this is not a rubber stamp
A leader that returns valid JSON, valid enums and a plausible rationale but a wrong conclusion is rejected because validators reach a different decision field themselves, or because the cited quotes do not exist in their own sources. Each of the four checks above is exercised by the local tests, and mutation checks (disable `_verify`, `_agree`, independent re-run, or digest check) each break tests.

## Limits (honest)
- Validators share the same model family and prompt; a systematic model error can pass consensus.
- The rule set catches fabricated quotes and temporal contradictions, not subtle misreadings of real clauses.
- Real-network behaviour (LLM variance, appeals, leader rotation) is verified only by the Studio integration tests, which are **not yet run** (see `TEST_REPORT.md`).
