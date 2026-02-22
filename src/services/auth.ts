interface EncryptedAuthPayload {
  algorithm: string;
  username: string;
  password: string;
}

const AUTH_KEY = "ct-explorer-auth-v1";
const AUTH_STORAGE_KEY = "cloudtrail-authenticated";

function xorBase64Decrypt(cipherText: string, key: string): string {
  const cipherBytes = Uint8Array.from(atob(cipherText), (char) => char.charCodeAt(0));
  const keyBytes = new TextEncoder().encode(key);
  const plainBytes = cipherBytes.map((value, index) => value ^ keyBytes[index % keyBytes.length]);
  return new TextDecoder().decode(plainBytes);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function loadEncryptedAuthPayload(): Promise<EncryptedAuthPayload> {
  const response = await fetch("/auth-credentials.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load authentication credentials");
  }
  return response.json() as Promise<EncryptedAuthPayload>;
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_STORAGE_KEY) === "true";
}

export function logout(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function authenticate(username: string, password: string): Promise<boolean> {
  const payload = await loadEncryptedAuthPayload();
  if (payload.algorithm !== "xor-base64-v1") {
    throw new Error("Unsupported credential format");
  }

  const expectedUsername = xorBase64Decrypt(payload.username, AUTH_KEY);
  const expectedPassword = xorBase64Decrypt(payload.password, AUTH_KEY);
  const valid = safeEqual(username.trim(), expectedUsername) && safeEqual(password, expectedPassword);

  if (valid) {
    localStorage.setItem(AUTH_STORAGE_KEY, "true");
  }

  return valid;
}
