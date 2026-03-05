import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, TOKEN_STORAGE_KEY } from "../config";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export function setStoredToken(session) {
  if (session?.access_token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, session.access_token);
    return;
  }
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function readTokensFromHash(hashValue = window.location.hash) {
  const hash = hashValue.startsWith("#") ? hashValue.slice(1) : hashValue;
  if (!hash) {
    return null;
  }

  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
  };
}

export async function syncSessionFromUrlHash() {
  const callbackTokens = readTokensFromHash();
  if (!callbackTokens) {
    return;
  }

  try {
    await supabase.auth.setSession({
      access_token: callbackTokens.accessToken,
      refresh_token: callbackTokens.refreshToken,
    });
  } finally {
    const cleanUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState({}, document.title, cleanUrl);
  }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  setStoredToken(data.session);
  return data.session;
}

export async function signInWithGoogle(redirectTo) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    throw error;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  setStoredToken(null);
  if (error) {
    throw error;
  }
}
