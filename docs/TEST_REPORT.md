# Test Report (honest status)

Authoring environment: a sandbox with **no network access, no GenLayer CLI/Studio, no `genvm-lint`, no `genlayer-test`, no npm registry**. Therefore nothing below was run on GenVM, Studio, or any network.

## What was actually run
| Check | Result | Notes |
|---|---|---|
| `python3 -m py_compile contracts/policyshift.py` | PASSED | Syntax only. Not `genvm-lint`. |
| `tests/direct/test_policyshift_logic.py` (25 tests) | PASSED 25/25 | Runs against `tests/stub/genlayer`, a **local test double, not GenVM**. Covers lineage, input validation, freeze/evidence gating, state machine, authorization, deterministic coercions, leader/validator functions, tamper/digest/injection cases. |
| Mutation checks on the validator | PASSED (tests fail as expected) | Disabling `_verify` -> 2 failures; `_agree` -> 5; independent re-run -> 5; digest check -> 2. Original restored: 25/25. |
| `scripts/make_bad_leader.py` + `py_compile` of its output | PASSED | Generates a deliberately wrong-leader build for integration tests. |

The stub's LLM is a scripted function that reads the prompt's source blocks. It shows that the contract's **verification logic** rejects wrong, contradictory, fabricated and injected leader outputs. It does **not** show how real validators or real LLMs behave.

## NOT run (BLOCKED)
| Item | Blocked by |
|---|---|
| `genvm-lint` (check + validate) | tool not installed / no network |
| `genlayer-test` direct-mode tests | package not installed |
| Studio integration tests (`tests/integration/`) | no Studio, no LLM provider, no hosted fixture URLs |
| Acceptance gate A2 on real validators (agree / wrong-leader rejected / contradiction rejected / wording tolerance / INCONCLUSIVE / injection) | needs Studio + `make_bad_leader.py` build deployed |
| Deployment, contract address, transaction receipts | no network, no account |
| Frontend `npm install`, `typecheck`, `build`, browser run | no registry; `genlayer-js` call shapes unverified |

## Deployment status
**Not deployed.** No contract address, transaction hash, or network result exists. Do not treat any value in this repo as a deployed address.

## Known risks to resolve first (in order)
1. Run `genvm-lint` and fix whatever it reports; confirm the runner hash in line 1 against the official boilerplate.
2. Confirm in Studio: `hashlib`/`re` imports work, `gl.nondet.web.get` field names, `exec_prompt` return shape, dataclass-in-TreeMap mutation, `Address.as_hex`.
3. Run `tests/integration` with hosted fixtures; deploy the bad-leader build and demonstrate rejection.
4. `setup.sh` + `npm run typecheck`; adjust only `frontend/lib/chain.ts`.
5. Verify that the real LLM follows the JSON schema often enough; tune prompts (the self-check fails closed with `[LLM_ERROR]`).
