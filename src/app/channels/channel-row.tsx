"use client";

import { useState, useRef } from "react";
import { updateChannel, deleteChannel } from "@/lib/tv-actions";

export default function ChannelRow({
  id,
  name,
  isAdmin,
}: {
  id: string;
  name: string;
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleRename(formData: FormData) {
    await updateChannel(id, formData);
    setEditing(false);
  }

  async function handleDelete() {
    await deleteChannel(id);
  }

  return (
    <li className="group flex items-center justify-between gap-3 py-3">
      {editing ? (
        <form action={handleRename} className="flex flex-1 items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            name="name"
            defaultValue={name}
            autoFocus
            required
            className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          />
          <button
            type="submit"
            className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white transition-all hover:bg-emerald-700 active:scale-[0.96] dark:bg-emerald-500 dark:text-stone-900 dark:hover:bg-emerald-400"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-xs text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          >
            Cancel
          </button>
        </form>
      ) : (
        <>
          <span className="text-sm font-medium text-stone-900 dark:text-stone-100">
            {name}
          </span>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-full px-2.5 py-1 text-xs text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
              >
                Rename
              </button>
            )}
            <form action={handleDelete}>
              <button
                type="submit"
                className="rounded-full px-2.5 py-1 text-xs text-red-600 transition-colors hover:bg-red-50 active:scale-[0.96] dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Remove
              </button>
            </form>
          </div>
        </>
      )}
    </li>
  );
}
