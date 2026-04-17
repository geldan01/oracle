"use client";

import { useTransition } from "react";
import { updateSkillVisibility } from "@/lib/skill-actions";

interface VisibilityToggleProps {
  skillId: string;
  visibility: "INDIVIDUAL" | "HOUSEHOLD";
}

export default function VisibilityToggle({
  skillId,
  visibility,
}: VisibilityToggleProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange(mode: "INDIVIDUAL" | "HOUSEHOLD") {
    if (mode === visibility) return;
    startTransition(async () => {
      await updateSkillVisibility(skillId, mode);
    });
  }

  return (
    <div className="inline-flex rounded-full bg-stone-100 p-0.5 dark:bg-stone-800">
      {(
        [
          { value: "INDIVIDUAL" as const, label: "Just Me" },
          { value: "HOUSEHOLD" as const, label: "Household" },
        ]
      ).map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => handleChange(opt.value)}
          disabled={isPending}
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-all active:scale-[0.96] disabled:opacity-50 ${
            visibility === opt.value
              ? "bg-white text-stone-900 shadow-sm dark:bg-stone-700 dark:text-stone-100"
              : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
