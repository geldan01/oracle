import { redirect } from "next/navigation";
import Link from "next/link";
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
      preferences: {
        where: { userId: session.user.id },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex min-h-full flex-1 items-start justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="rounded-lg bg-white p-6 shadow ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Our TODO Lists
            </h1>
            <Link
              href="/dashboard"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              &larr; Dashboard
            </Link>
          </div>
        </div>

        {/* New List Form */}
        <div className="rounded-lg bg-white p-6 shadow ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Create a new list
          </h2>
          <form action={createTodoList} className="mt-4 flex gap-3">
            <input
              type="text"
              name="name"
              placeholder="List name..."
              required
              className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500"
            />
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              New list
            </button>
          </form>
        </div>

        {/* Lists */}
        {lists.length === 0 ? (
          <div className="rounded-lg bg-white p-6 shadow ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              No lists yet. Create one above to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {lists.map((list) => {
              const completedCount = list.items.filter(
                (item) => item.done
              ).length;
              const totalCount = list.items.length;
              const showOnDashboard =
                list.preferences.length === 0 ||
                list.preferences[0].showOnDashboard;

              return (
                <div
                  key={list.id}
                  className="rounded-lg bg-white p-6 shadow ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/todos/${list.id}`}
                        className="text-lg font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                      >
                        {list.name}
                      </Link>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {totalCount === 0
                          ? "No items"
                          : `${completedCount}/${totalCount} completed`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <form
                        action={toggleListOnDashboard.bind(null, list.id)}
                      >
                        <button
                          type="submit"
                          className={`rounded-md px-3 py-1.5 text-xs font-medium shadow-sm ${
                            showOnDashboard
                              ? "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                              : "border border-zinc-300 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                          }`}
                        >
                          {showOnDashboard ? "On dashboard" : "Hidden"}
                        </button>
                      </form>

                      <form action={deleteTodoList.bind(null, list.id)}>
                        <button
                          type="submit"
                          className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
