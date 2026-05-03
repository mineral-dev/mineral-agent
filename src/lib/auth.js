import { cookies } from "next/headers";
import { getSetting } from "./db";

const AUTH_COOKIE = "mineral-auth";
const DEFAULT_PASSWORD = "admin1";

export async function getPassword() {
  const password = await getSetting("password");
  return password || DEFAULT_PASSWORD;
}

export async function verifyPassword(password) {
  const validPassword = await getPassword();
  return password === validPassword;
}

export async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE)?.value;
}

export async function isAuthenticated() {
  const token = await getAuthToken();
  return token === "authenticated";
}

export async function setAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}
