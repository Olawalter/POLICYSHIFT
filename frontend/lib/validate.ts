// Mirrors the contract's input rules so users get errors before paying for a transaction.
export const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
export const TS_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
export const HEX64_RE = /^[0-9a-f]{64}$/;
const BLOCKED_HOST = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2[0-9]|3[01])\.|0\.|\[)/;

export const checkId = (v: string, what: string) => (ID_RE.test(v) ? "" : `${what}: letters, digits, . _ - (max 64)`);
export const checkTs = (v: string, what: string, optional = false) =>
  optional && v === "" ? "" : TS_RE.test(v) ? "" : `${what}: use UTC form 2026-01-31T00:00:00Z`;
export const checkDigest = (v: string, what: string) => (HEX64_RE.test(v) ? "" : `${what}: 64 lowercase hex characters`);
export function checkUrl(v: string, what: string) {
  if (v.length > 512 || !/^https:\/\/[A-Za-z0-9.-]+(:\d{1,5})?(\/\S*)?$/.test(v) || v.includes("@")) return `${what}: https URL, max 512 chars`;
  const host = v.slice(8).split("/")[0].split(":")[0];
  return BLOCKED_HOST.test(host) ? `${what}: local/private hosts are not allowed` : "";
}
export const checkLen = (v: string, what: string, lo: number, hi: number) =>
  v.trim().length >= lo && v.length <= hi ? "" : `${what}: ${lo}-${hi} characters`;
export const firstError = (...errs: string[]) => errs.find((e) => e) || "";
export const nowUtc = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
