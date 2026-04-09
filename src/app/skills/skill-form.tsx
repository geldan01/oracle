"use client";

import { useState } from "react";
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
    skill?.visibility ?? "INDIVIDUAL"
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    skill?.tags.map((t) => t.name) ?? []
  );
  const [customTag, setCustomTag] = useState("");

  const allTagOptions = Array.from(
    new Set([...allTags, ...selectedTags])
  ).sort();

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
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

  return (
    <form action={action} className="space-y-6">
      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-stone-700 dark:text-stone-300"
        >
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          defaultValue={skill?.title ?? ""}
          required
          className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-800 shadow-sm outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
          placeholder="e.g. How to sharpen a knife"
        />
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
          Owner
        </label>
        <input type="hidden" name="visibility" value={visibility} />
        <div className="mt-2 inline-flex rounded-lg border border-fuchsia-200 dark:border-fuchsia-800">
          {([
            { value: "INDIVIDUAL" as const, label: "Just Me" },
            { value: "HOUSEHOLD" as const, label: "Household" },
          ]).map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setVisibility(opt.value)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                i === 0 ? "rounded-l-lg" : "rounded-r-lg border-l border-fuchsia-200 dark:border-fuchsia-800"
              } ${
                visibility === opt.value
                  ? "bg-fuchsia-500 text-white dark:bg-fuchsia-500"
                  : "bg-stone-100 text-fuchsia-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-fuchsia-300 dark:hover:bg-stone-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300">
          Tags
        </label>
        {selectedTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className="inline-flex items-center gap-1 rounded-full bg-fuchsia-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-fuchsia-800"
              >
                {tag}
                <span className="ml-0.5 text-fuchsia-200">&times;</span>
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
                  className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600"
                >
                  {tag}
                </button>
              ))}
          </div>
        )}
        <div className="mt-2 flex gap-2">
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
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 outline-none focus:border-fuchsia-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
            placeholder="Custom tag..."
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="rounded-lg bg-stone-200 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-300 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600"
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
        <label
          htmlFor="content"
          className="block text-sm font-medium text-stone-700 dark:text-stone-300"
        >
          Content (markdown)
        </label>
        <textarea
          id="content"
          name="content"
          defaultValue={skill?.content ?? ""}
          rows={12}
          className="mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono text-sm text-stone-800 shadow-sm outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
          placeholder="Write your skill notes in markdown..."
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-fuchsia-500 px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-fuchsia-800"
        >
          {skill ? "Save Changes" : "Create Skill"}
        </button>
      </div>
    </form>
  );
}
