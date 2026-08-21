"use client";

// Client-side auth helpers. Token lives in localStorage — this is a
// standalone app (not an embedded artifact), so browser storage is the
// normal, correct choice here.

const TOKEN_KEY = "scoutcrm_token";

export const AUTH_REQUIRED = process.env.NEXT_PUBLIC_AUTH_REQUIRED === "true";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

// Wraps fetch() to automatically attach the stored bearer token, if any.
// Use this for every call to our own /api/* routes from client components.
export async function authFetch(input: string, init: RequestInit = {}) {
  const token = getStoredToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
