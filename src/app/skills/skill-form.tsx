"use client";

import { useState } from "react";
import { X } from "@phosphor-icons/react";
import { createSkill, updateSkill } from "@/lib/skill-actions";

type Visibility = "INDIVIDUAL" | "HOUSEHOLD";

interface SkillFormProps {
  skill?: {
    id: string;
    title: string;
    content: string | null;
    visibility: "INDIVIDUAL" | "HOUSEHOLD";
    tags: { id: string; name: string }[];
  };
  allTags: string[];
}

export default function SkillForm({ skill, allTags }: SkillFormProps) {
  const [visibility, setVisibility] = useState<Visibility>(
    skill?.visibility ?? "INDIVIDUAL",
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    skill?.tags.map((t) => t.name) ?? [],
  );
  const [customTag, setCustomTag] = useState("");

  const allTagOptions = Array.from(
    new Set([...allTags, ...selectedTags]),
  ).sort();

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function addCustomTag() {
    const tag = customTag.trim().toLowerCase();
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
    }
    setCustomTag("");
  }

  const action = skill ? updateSkill.bind(null, skill.id) : createSkill;

  const inputClass =
    "block w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100";

  const labelClass =
    "block text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400";

  return (
    <form action={action} className="space-y-8">
      {/* Title */}
      <div>
        <label htmlFor="title" className={labelClass}>
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          defaultValue={skill?.title ?? ""}
          required
          className={`mt-2 ${inputClass}`}
          placeholder="e.g. How to sharpen a knife"
        />
      </div>

      {/* Visibility */}
      <div>
        <label className={labelClass}>Owner</label>
        <input type="hidden" name="visibility" value={visibility} />
        <div className="mt-2 inline-flex rounded-full bg-stone-100 p-0.5 dark:bg-stone-800">
          {(
            [
              { value: "INDIVIDUAL" as const, label: "Just Me" },
              { value: "HOUSEHOLD" as const, label: "Household" },
            ]
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setVisibility(opt.value)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-all active:scale-[0.98] ${
                visibility === opt.value
                  ? "bg-white text-stone-900 shadow-sm dark:bg-stone-700 dark:text-stone-100"
                  : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className={labelClass}>Tags</label>
        {selectedTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-medium text-white transition-all hover:bg-emerald-700 active:scale-[0.96] dark:bg-emerald-500 dark:text-stone-900 dark:hover:bg-emerald-400"
              >
                #{tag}
                <X size={10} weight="bold" />
              </button>
            ))}
          </div>
        )}
        {allTagOptions.filter((t) => !selectedTags.includes(t)).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {allTagOptions
              .filter((t) => !selectedTags.includes(t))
              .map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="rounded-full px-2.5 py-0.5 text-xs text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                >
                  +#{tag}
                </button>
              ))}
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomTag();
              }
            }}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
            placeholder="Add custom tag…"
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="rounded-lg px-3 py-1.5 text-sm text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98] dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          >
            Add
          </button>
        </div>
        {selectedTags.map((tag) => (
          <input key={tag} type="hidden" name="tags" value={tag} />
        ))}
      </div>

      {/* Content (markdown) */}
      <div>
        <label htmlFor="content" className={labelClass}>
          Content (markdown)
        </label>
        <textarea
          id="content"
          name="content"
          defaultValue={skill?.content ?? ""}
          rows={14}
          className={`mt-2 font-mono ${inputClass}`}
          placeholder="Write your skill notes in markdown…"
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] dark:bg-emerald-500 dark:text-stone-900 dark:hover:bg-emerald-400"
        >
          {skill ? "Save changes" : "Create skill"}
        </button>
      </div>
    </form>
  );
}
