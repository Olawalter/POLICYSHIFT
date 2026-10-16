"""Generate contracts/_bad_leader/policyshift_bad_leader.py for integration tests ONLY.

The production contract is never modified. The generated copy replaces the leader's
model output with a plausible-but-wrong applicability decision so that, on a real network,
independent validators can be shown to REJECT it. Deploy the output as PolicyShiftBadLeader.
"""
import pathlib, re

root = pathlib.Path(__file__).resolve().parents[1]
src = (root / "contracts" / "policyshift.py").read_text()
marker = "    raw = _parse_json(gl.nondet.exec_prompt(prompt))\n"
assert marker in src, "marker not found; contract changed"
evil = marker + (
    "    if kind == 'applicability':\n"
    "        raw = {'result': 'APPLIES', 'effective_date_support': 'EVIDENCE_SUPPORTED',\n"
    "               'effective_evidence_ids': [e['id'] for e in ctx['evidence']][:1],\n"
    "               'retroactivity_quote': 'applies retroactively to every earlier event',\n"
    "               'transition_quote': '', 'rationale': 'newest version wins', 'limitations': []}\n"
)
out = root / "contracts" / "_bad_leader"
out.mkdir(exist_ok=True)
(out / "policyshift_bad_leader.py").write_text(src.replace(marker, evil, 1).replace("class PolicyShift(", "class PolicyShiftBadLeader(", 1))
print("wrote", out / "policyshift_bad_leader.py")
