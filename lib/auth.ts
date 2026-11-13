import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { ensureWorldSeeded } from "./seed";

const SESSION_COOKIE = "omerta_session";
const SECRET = process.env.SESSION_SECRET || "omerta-barafranca-secret-key-2026";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(key, "hex"), Buffer.from(derived, "hex"));
}

function signUserId(userId: string): string {
  const hmac = crypto.createHmac("sha256", SECRET).update(userId).digest("hex");
  return `${userId}.${hmac}`;
}

function verifySignedToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [userId, sig] = parts;
  const expected = crypto.createHmac("sha256", SECRET).update(userId).digest("hex");
  if (sig.length !== expected.length) return null;
  const valid = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  return valid ? userId : null;
}

export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, signUserId(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  await ensureWorldSeeded();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const userId = verifySignedToken(token);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      vehicles: {
        orderBy: { createdAt: "desc" },
      },
      inventory: true,
    },
  });

  if (!user || user.isNpc) return null;
  return user;
}

