# Frontend Spec (Next.js App Router + TypeScript + genlayer-js)

All chain access is isolated in `frontend/lib/chain.ts`; pages only call those functions.

## Pages
`/` overview (protocol, policies, cases) - `/policies` list/register - `/policies/[id]` lineage and version registration - `/cases` list - `/cases/new` open case - `/cases/[id]` case workspace: criteria, evidence, adjudication, results - `/cases/[id]/receipt` full receipt - `/settings` contract address, network.

## Behaviour requirements
- Wallet connect, network check against the configured chain object from `genlayer-js/chains` (never a hard-coded chain id), clear wrong-network banner that blocks writes.
- Contract address comes from `NEXT_PUBLIC_POLICYSHIFT_ADDRESS`; missing address renders a setup state, never a fake address.
- Forms validate with the same rules as the contract (ids, https URL, 64-hex digest, UTC timestamps, lengths).
- Client-side digest helper: fetches a URL (when CORS allows) or accepts a pasted file and computes sha256 of the raw bytes, labelled `raw-sha256-v1`.
- Transaction lifecycle panel (separate from application status): submitted hash -> waiting (ACCEPTED) -> waiting (FINALIZED); shows receipt status honestly, including failure/revert messages. Pending hashes persist in `localStorage` for recovery; **no automatic resubmission**.
- Application status badge and an ordered stepper reflect only contract state read after receipt.
- Result cards show decision, quoted clauses, rationale, limitations, unavailable evidence, criteria digest.
- Every user-facing text distinguishes `INCONCLUSIVE` from verdicts and explains that LLM-derived results are advisory evidence with quotes, not legal determinations.

## Not implemented / to verify at integration time
- `genlayer-js` call shapes (`createClient`, `readContract`, `writeContract`, `waitForTransactionReceipt`, `TransactionStatus`) are used as documented in public examples but have not been type-checked here (no network access to install packages). `chain.ts` is the only file to adjust.
