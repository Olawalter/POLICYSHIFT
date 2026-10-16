// raw-sha256-v1: sha256 over the raw response bytes (matches the contract's digest scheme).
export async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function digestOfText(text: string) {
  return sha256Hex(new TextEncoder().encode(text).buffer as ArrayBuffer);
}
export async function digestOfFile(file: File) {
  return sha256Hex(await file.arrayBuffer());
}
/** Works only when the host allows CORS; otherwise the user should paste/upload the file. */
export async function digestOfUrl(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return sha256Hex(await r.arrayBuffer());
}
