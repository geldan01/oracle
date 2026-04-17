import Link from "next/link";
import { auth } from "@/lib/auth";
import { logout } from "@/lib/auth-actions";
import { Role } from "@/generated/prisma";
import ThemeToggle from "@/components/ThemeToggle";

export default async function Header() {
  const session = await auth();

  return (
    <header className="border-b border-stone-200/80 bg-background dark:border-stone-800/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/dashboard"
          className="flex items-baseline gap-2 text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100"
        >
          <span>Oracle</span>
          {process.env.NEXT_PUBLIC_SITE_TITLE && (
            <span className="text-sm font-normal text-stone-400 dark:text-stone-500">
              · {process.env.NEXT_PUBLIC_SITE_TITLE}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session?.user && (
            <>
              {session.user.role === Role.ADMIN && (
                <Link
                  href="/admin"
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98] dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                >
                  Admin
                </Link>
              )}
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98] dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                >
                  Sign out
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
