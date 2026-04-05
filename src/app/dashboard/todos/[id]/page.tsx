import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  renameTodoList,
  deleteTodoList,
  addTodoItem,
  toggleTodoItem,
  deleteTodoItem,
} from "@/lib/todo-actions";

export default async function TodoListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const list = await prisma.todoList.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!list) {
    redirect("/dashboard/todos");
  }

  return (
    <div className="flex min-h-full flex-1 items-start justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="rounded-lg bg-white p-6 shadow ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {list.name}
            </h1>
            <Link
              href="/dashboard/todos"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              &larr; All Lists
            </Link>
          </div>
        </div>

        {/* Rename & Delete */}
        <div className="rounded-lg bg-white p-6 shadow ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            List settings
          </h2>
          <form
            action={renameTodoList.bind(null, id)}
            className="mt-4 flex gap-3"
          >
            <input
              type="text"
              name="name"
              defaultValue={list.name}
              required
              className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-500"
            />
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Rename
            </button>
          </form>
          <div className="mt-4">
            <form action={deleteTodoList.bind(null, id)}>
              <button
                type="submit"
                className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
              >
                Delete this list
              </button>
            </form>
          </div>
        </div>

        {/* Add Item */}
        <div className="rounded-lg bg-white p-6 shadow ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Add item
          </h2>
          <form
            action={addTodoItem.bind(null, id)}
            className="mt-4 flex gap-3"
          >
            <input
              type="text"
              name="text"
              placeholder="What needs to be done?"
              required
              className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-500"
            />
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Add
            </button>
          </form>
        </div>

        {/* Items List */}
        <div className="rounded-lg bg-white p-6 shadow ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Items
          </h2>
          {list.items.length === 0 ? (
            <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No items yet. Add one above.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
              {list.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="flex items-center gap-3">
                    <form action={toggleTodoItem.bind(null, item.id)}>
                      <button
                        type="submit"
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          item.done
                            ? "border-emerald-500 bg-emerald-500 text-white dark:border-emerald-400 dark:bg-emerald-400"
                            : "border-zinc-300 bg-white hover:border-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:border-zinc-500"
                        }`}
                        aria-label={
                          item.done
                            ? `Mark "${item.text}" as not done`
                            : `Mark "${item.text}" as done`
                        }
                      >
                        {item.done && (
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                    </form>
                    <span
                      className={`text-sm ${
                        item.done
                          ? "text-zinc-400 line-through dark:text-zinc-500"
                          : "text-zinc-900 dark:text-zinc-100"
                      }`}
                    >
                      {item.text}
                    </span>
                  </div>

                  <form action={deleteTodoItem.bind(null, item.id)}>
                    <button
                      type="submit"
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                      aria-label={`Delete "${item.text}"`}
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
