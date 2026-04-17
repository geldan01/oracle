import { redirect } from "next/navigation";
import Link from "next/link";
import { CaretRight, ListChecks } from "@phosphor-icons/react/dist/ssr";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createTodoList,
  deleteTodoList,
  toggleListOnDashboard,
} from "@/lib/todo-actions";

export default async function TodoListsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const lists = await prisma.todoList.findMany({
    include: {
      items: true,
      preferences: { where: { userId: session.user.id } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/dashboard"
        className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300"
      >
        ← Dashboard
      </Link>
      <h1 className="mt-4 flex items-center gap-3 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
        <ListChecks size={28} weight="duotone" className="text-amber-500 dark:text-amber-400" />
        Shared Todos
      </h1>

      {/* New list */}
      <form action={createTodoList} className="mt-8 flex gap-2">
        <input
          type="text"
          name="name"
          placeholder="New list name…"
          required
          className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder-stone-500"
        />
        <button
          type="submit"
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] dark:bg-emerald-500 dark:text-stone-900 dark:hover:bg-emerald-400"
        >
          Create
        </button>
      </form>

      {/* Lists */}
      <div className="mt-10">
        {lists.length === 0 ? (
          <p className="py-8 text-sm text-stone-400 dark:text-stone-500">
            No lists yet. Create one above to get started.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {lists.map((list) => {
              const completedCount = list.items.filter((i) => i.done).length;
              const totalCount = list.items.length;
              const showOnDashboard =
                list.preferences.length === 0 ||
                list.preferences[0].showOnDashboard;

              return (
                <li
                  key={list.id}
                  className="group flex items-center justify-between gap-4 py-4"
                >
                  <Link
                    href={`/dashboard/todos/${list.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-medium text-stone-900 dark:text-stone-100">
                        {list.name}
                      </p>
                      <p className="text-xs text-stone-500 tabular-nums dark:text-stone-400">
                        {totalCount === 0
                          ? "No items"
                          : `${completedCount}/${totalCount} done`}
                      </p>
                    </div>
                    <CaretRight
                      size={14}
                      className="text-stone-300 dark:text-stone-600"
                    />
                  </Link>

                  <div className="flex shrink-0 items-center gap-1">
                    <form action={toggleListOnDashboard.bind(null, list.id)}>
                      <button
                        type="submit"
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all active:scale-[0.96] ${
                          showOnDashboard
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                            : "text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                        }`}
                      >
                        {showOnDashboard ? "Pinned" : "Hidden"}
                      </button>
                    </form>
                    <form action={deleteTodoList.bind(null, list.id)}>
                      <button
                        type="submit"
                        className="rounded-full px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 active:scale-[0.96] dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
