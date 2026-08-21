"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setStoredToken } from "@/lib/authClient";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const body =
      mode === "login" ? { email, password } : { name, email, password };
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok || !data.authToken) {
      setError(data.error ?? data.message ?? "Something went wrong.");
      return;
    }
    setStoredToken(data.authToken);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-7">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white text-base font-bold">
            S
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-neutral-900">ScoutCRM</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            AI sales intelligence — live web signals, not stale contact cards.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
          <div className="flex rounded-lg bg-neutral-100 p-1 mb-5 text-sm">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-md py-1.5 font-medium transition-all ${
                mode === "login"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-md py-1.5 font-medium transition-all ${
                mode === "signup"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <input
                required
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100 transition-shadow"
              />
            )}
            <input
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100 transition-shadow"
            />
            <input
              required
              type="password"
              placeholder="Password (min 8 chars, 1 letter, 1 number)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-100 transition-shadow"
            />
            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-2.5 py-1.5">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-neutral-700 active:scale-[0.99] disabled:opacity-50 transition-all"
            >
              {loading ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
