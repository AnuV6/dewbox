export interface AuthEnv {
  ADMIN_PASSWORD: string;
  SESSION_SECRET: string;
}

const COOKIE_NAME = "dewbox_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export async function createSessionCookie(env: AuthEnv): Promise<string> {
  const expires = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = `${expires}`;
  const sig = await hmac(env.SESSION_SECRET, payload);
  const value = encodeURIComponent(`${payload}.${sig}`);
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function isAuthenticated(request: Request, env: AuthEnv): Promise<boolean> {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;

  const value = decodeURIComponent(match[1]);
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return false;

  const expected = await hmac(env.SESSION_SECRET, payload);
  if (expected !== sig) return false;

  const expires = Number(payload);
  return Number.isFinite(expires) && Date.now() < expires;
}
