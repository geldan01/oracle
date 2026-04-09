"use client";

import { useTransition } from "react";
import { updateSkillVisibility } from "@/lib/skill-actions";

interface VisibilityToggleProps {
  skillId: string;
  visibility: "INDIVIDUAL" | "HOUSEHOLD";
}

export default function VisibilityToggle({ skillId, visibility }: VisibilityToggleProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(mode: "INDIVIDUAL" | "HOUSEHOLD") {
    if (mode === visibility) return;
    startTransition(async () => {
      await updateSkillVisibility(skillId, mode);
    });
  }

  return (
    <div className="mt-1 inline-flex rounded-lg border border-fuchsia-200 dark:border-fuchsia-800">
      <button
        type="button"
        onClick={() => handleChange("INDIVIDUAL")}
        disabled={isPending}
        className={`rounded-l-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
          visibility === "INDIVIDUAL"
            ? "bg-fuchsia-500 text-white dark:bg-fuchsia-500"
            : "bg-stone-100 text-fuchsia-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-fuchsia-300 dark:hover:bg-stone-700"
        }`}
      >
        Just Me
      </button>
      <button
        type="button"
        onClick={() => handleChange("HOUSEHOLD")}
        disabled={isPending}
        className={`rounded-r-lg border-l border-fuchsia-200 px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 dark:border-fuchsia-800 ${
          visibility === "HOUSEHOLD"
            ? "bg-fuchsia-500 text-white dark:bg-fuchsia-500"
            : "bg-stone-100 text-fuchsia-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-fuchsia-300 dark:hover:bg-stone-700"
        }`}
      >
        Household
      </button>
    </div>
  );
}
