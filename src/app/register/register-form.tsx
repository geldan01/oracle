"use client";

import { useActionState } from "react";
import Link from "next/link";
import { register } from "@/lib/auth-actions";

function validateAndRegister(
  _prevState: { error: string } | undefined,
  formData: FormData,
) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  return register(_prevState, formData);
}

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    validateAndRegister,
    undefined,
  );
  const error = state?.error;

  const inputClass =
    "block w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-100 dark:placeholder-stone-500";
  const labelClass =
    "block text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400";

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-sm flex-col justify-center px-4 py-12">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
          New here
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          Create account
        </h1>
      </div>

      <form action={formAction} className="mt-10 space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className={labelClass}>
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className={`mt-2 ${inputClass}`}
            placeholder="Your name"
          />
        </div>

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
            autoComplete="new-password"
            className={`mt-2 ${inputClass}`}
            placeholder="Create a password"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className={labelClass}>
            Confirm
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            className={`mt-2 ${inputClass}`}
            placeholder="Confirm your password"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 dark:bg-emerald-500 dark:text-stone-900 dark:hover:bg-emerald-400"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-stone-500 dark:text-stone-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-400"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
