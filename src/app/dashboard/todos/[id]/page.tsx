import { redirect } from "next/navigation";
import Link from "next/link";
import { Check, X, Plus } from "@phosphor-icons/react/dist/ssr";
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
  if (!session) redirect("/login");

  const { id } = await params;

  const list = await prisma.todoList.findUnique({
    where: { id },
    include: { items: { orderBy: { position: "asc" } } },
  });

  if (!list) redirect("/dashboard/todos");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <Link
        href="/dashboard/todos"
        className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300"
      >
        ← Lists
      </Link>

      {/* Rename form acts as the title */}
      <form action={renameTodoList.bind(null, id)} className="mt-4">
        <input
          type="text"
          name="name"
          defaultValue={list.name}
          required
          className="w-full bg-transparent text-3xl font-semibold tracking-tight text-stone-900 outline-none transition-colors hover:bg-stone-50 focus:bg-stone-50 dark:text-stone-100 dark:hover:bg-stone-900 dark:focus:bg-stone-900"
          aria-label="List name"
        />
      </form>

      {/* Add item */}
      <form
        action={addTodoItem.bind(null, id)}
        className="mt-8 flex gap-2"
      >
        <input
          type="text"
          name="text"
          placeholder="Add a new item…"
          required
          className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder-stone-500"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] dark:bg-emerald-500 dark:text-stone-900 dark:hover:bg-emerald-400"
        >
          <Plus size={14} weight="bold" />
          Add
        </button>
      </form>

      {/* Items */}
      <div className="mt-8">
        {list.items.length === 0 ? (
          <p className="py-4 text-sm text-stone-400 dark:text-stone-500">
            Nothing on this list yet.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {list.items.map((item) => (
              <li
                key={item.id}
                className="group flex items-center justify-between gap-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <form action={toggleTodoItem.bind(null, item.id)}>
                    <button
                      type="submit"
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all active:scale-90 ${
                        item.done
                          ? "border-emerald-500 bg-emerald-500 dark:border-emerald-400 dark:bg-emerald-400"
                          : "border-stone-300 hover:border-emerald-400 dark:border-stone-600 dark:hover:border-emerald-400"
                      }`}
                      aria-label={
                        item.done
                          ? `Mark "${item.text}" as not done`
                          : `Mark "${item.text}" as done`
                      }
                    >
                      {item.done && (
                        <Check
                          size={10}
                          weight="bold"
                          className="text-white dark:text-stone-900"
                        />
                      )}
                    </button>
                  </form>
                  <span
                    className={`text-sm ${
                      item.done
                        ? "text-stone-400 line-through dark:text-stone-500"
                        : "text-stone-900 dark:text-stone-100"
                    }`}
                  >
                    {item.text}
                  </span>
                </div>

                <form action={deleteTodoItem.bind(null, item.id)}>
                  <button
                    type="submit"
                    className="rounded p-1 text-stone-300 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100 dark:text-stone-600"
                    aria-label={`Delete "${item.text}"`}
                  >
                    <X size={14} weight="bold" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete list */}
      <div className="mt-12 border-t border-stone-200 pt-6 dark:border-stone-800">
        <form action={deleteTodoList.bind(null, id)}>
          <button
            type="submit"
            className="text-xs text-stone-400 underline-offset-2 transition-colors hover:text-red-500 hover:underline dark:text-stone-500"
          >
            Delete this list
          </button>
        </form>
      </div>
    </div>
  );
}
