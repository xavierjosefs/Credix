import type { AuthSession, AuthUser } from "@/app/src/modules/types/auth.types";

const AUTH_TOKEN_COOKIE = "auth_token";
const AUTH_USER_STORAGE_KEY = "auth_user";
const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
const AUTH_USER_EVENT = "auth-user-changed";

let cachedRawUser: string | null | undefined;
let cachedParsedUser: AuthUser | null = null;

export function saveSession(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(session.user));
  document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(session.token)}; path=/; max-age=${ONE_DAY_IN_SECONDS}; samesite=lax`;
  window.dispatchEvent(new Event(AUTH_USER_EVENT));
}

export function clearSession() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax`;
  window.dispatchEvent(new Event(AUTH_USER_EVENT));
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);

  if (!rawUser) {
    cachedRawUser = null;
    cachedParsedUser = null;
    return null;
  }

  if (rawUser === cachedRawUser) {
    return cachedParsedUser;
  }

  try {
    cachedRawUser = rawUser;
    cachedParsedUser = JSON.parse(rawUser) as AuthUser;
    return cachedParsedUser;
  } catch {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    cachedRawUser = null;
    cachedParsedUser = null;
    return null;
  }
}

export function hasStoredToken() {
  if (typeof document === "undefined") {
    return false;
  }

  return document.cookie
    .split("; ")
    .some((cookie) => cookie.startsWith(`${AUTH_TOKEN_COOKIE}=`));
}

export function getAuthToken() {
  if (typeof document === "undefined") {
    return null;
  }

  const tokenCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${AUTH_TOKEN_COOKIE}=`));

  if (!tokenCookie) {
    return null;
  }

  return decodeURIComponent(tokenCookie.split("=")[1] ?? "");
}

export function subscribeStoredUser(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => {
    onStoreChange();
  };

  window.addEventListener("storage", handleChange);
  window.addEventListener(AUTH_USER_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(AUTH_USER_EVENT, handleChange);
  };
}

export function getStoredUserServerSnapshot(): AuthUser | null {
  return null;
}
