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
    <li className="flex items-center justify-between px-5 py-3.5">
      {editing ? (
        <form action={handleRename} className="flex flex-1 items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            name="name"
            defaultValue={name}
            autoFocus
            required
            className="flex-1 rounded-md border border-violet-300 bg-white px-3 py-1.5 text-sm text-stone-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none dark:border-violet-700 dark:bg-stone-800 dark:text-stone-100"
          />
          <button
            type="submit"
            className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-xs text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
          >
            Cancel
          </button>
        </form>
      ) : (
        <>
          <span className="font-medium text-stone-800 dark:text-stone-200">
            {name}
          </span>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs text-violet-500 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
              >
                Rename
              </button>
            )}
            <form action={handleDelete}>
              <button
                type="submit"
                className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
