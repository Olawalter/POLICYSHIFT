"""LOCAL TEST DOUBLE - NOT GenVM, NOT the official SDK.

Mimics only the documented surface used by contracts/policyshift.py so the
contract's own logic (state machine, deterministic rules, validator function)
can be exercised without the GenLayer toolchain. It does not implement real
consensus, calldata encoding, storage proxies, gas, or LLM/web nondeterminism.
Results from this harness are NEVER evidence of on-chain validator consensus.
"""
from types import SimpleNamespace


class ConsensusRejected(Exception):
    """Stub-only: validators did not agree (real network: leader rotation / UNDETERMINED)."""


class UserError(Exception):
    def __init__(self, message=""):
        super().__init__(message)
        self.message = message


class Return:
    def __init__(self, calldata):
        self.calldata = calldata


class Address:
    def __init__(self, hexstr="0x" + "00" * 20):
        self.as_hex = hexstr.lower()

    def __eq__(self, o):
        return isinstance(o, Address) and o.as_hex == self.as_hex

    def __ne__(self, o):
        return not self.__eq__(o)

    def __hash__(self):
        return hash(self.as_hex)


class TreeMap(dict):
    def __class_getitem__(cls, item):
        return cls


class DynArray(list):
    def __class_getitem__(cls, item):
        return cls


def u32(x=0):
    return int(x)


def allow_storage(cls):
    return cls


class _Stub:
    def __init__(self):
        self.reset()

    def reset(self):
        self.sender = Address("0x" + "11" * 20)
        self.env = {"web": {}, "llm": None}
        self.validator_envs = []
        self.last_votes = []
        self.prompts = []


STUB = _Stub()


class Contract:
    def __init__(self):
        for name, ann in getattr(type(self), "__annotations__", {}).items():
            if ann is TreeMap:
                setattr(self, name, TreeMap())
            elif ann is DynArray:
                setattr(self, name, DynArray())


class _Resp:
    def __init__(self, status, body):
        self.status = status
        self.body = body


def _web_get(url, **kw):
    entry = STUB.env["web"].get(url)
    if entry is None:
        raise Exception("no route for " + url)
    if isinstance(entry, tuple):
        return _Resp(entry[0], entry[1])
    return _Resp(200, entry)


def _exec_prompt(prompt, **kw):
    STUB.prompts.append(prompt)
    return STUB.env["llm"](prompt)


def _run_nondet_unsafe(leader_fn, validator_fn):
    leader_env = STUB.env
    try:
        leader_res = Return(leader_fn())
    except UserError as e:
        leader_res = e
    votes = []
    for venv in STUB.validator_envs:
        STUB.env = venv
        try:
            votes.append(bool(validator_fn(leader_res)))
        except Exception:
            votes.append(False)
    STUB.env = leader_env
    STUB.last_votes = votes
    STUB.captured_validator = validator_fn
    if votes and sum(votes) * 2 <= len(votes):
        raise ConsensusRejected(str(votes))
    if isinstance(leader_res, UserError):
        raise leader_res
    return leader_res.calldata


class _Msg:
    @property
    def sender_address(self):
        return STUB.sender


gl = SimpleNamespace(
    Contract=Contract,
    public=SimpleNamespace(write=lambda f: f, view=lambda f: f),
    message=_Msg(),
    nondet=SimpleNamespace(web=SimpleNamespace(get=_web_get), exec_prompt=_exec_prompt),
    vm=SimpleNamespace(UserError=UserError, Return=Return, run_nondet_unsafe=_run_nondet_unsafe),
)

__all__ = ["gl", "TreeMap", "DynArray", "u32", "Address", "allow_storage"]
