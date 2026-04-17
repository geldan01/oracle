"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/lib/auth-actions";

export default function LoginForm({ showRegister }: { showRegister: boolean }) {
  const [state, formAction, pending] = useActionState(login, undefined);

  const inputClass =
    "block w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-100 dark:placeholder-stone-500";
  const labelClass =
    "block text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-sm flex-col justify-center px-4 py-12">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
          Welcome back
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          Sign in
        </h1>
      </div>

      <form action={formAction} className="mt-10 space-y-6">
        {state?.error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {state.error}
          </div>
        )}

        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={`mt-2 ${inputClass}`}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={`mt-2 ${inputClass}`}
            placeholder="Enter your password"
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="rememberMe"
            value="true"
            defaultChecked
            className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 dark:border-stone-700 dark:bg-stone-900"
          />
          <span className="text-sm text-stone-600 dark:text-stone-400">
            Keep me signed in
          </span>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 dark:bg-emerald-500 dark:text-stone-900 dark:hover:bg-emerald-400"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {showRegister && (
        <p className="mt-8 text-center text-sm text-stone-500 dark:text-stone-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-400"
          >
            Register
          </Link>
        </p>
      )}
    </div>
  );
}
