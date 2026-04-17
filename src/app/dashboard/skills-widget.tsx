import Link from "next/link";
import { Books, Star } from "@phosphor-icons/react/dist/ssr";

interface SkillSummary {
  id: string;
  title: string;
  visibility: "INDIVIDUAL" | "HOUSEHOLD";
  tags: { id: string; name: string }[];
}

interface SkillsWidgetProps {
  skills: SkillSummary[];
}

export default function SkillsWidget({ skills }: SkillsWidgetProps) {
  return (
    <section>
      <Link
        href="/skills"
        className="group flex items-center gap-3 transition-opacity hover:opacity-70"
      >
        <Books size={20} weight="regular" className="text-fuchsia-600 dark:text-fuchsia-400" />
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Favourite Skills
        </h2>
      </Link>

      {skills.length > 0 ? (
        <ul className="mt-4 divide-y divide-stone-100 dark:divide-stone-800">
          {skills.slice(0, 5).map((skill) => (
            <li key={skill.id}>
              <Link
                href={`/skills/${skill.id}`}
                className="flex items-center justify-between gap-3 py-2.5 text-sm text-stone-900 transition-colors hover:bg-stone-50 dark:text-stone-100 dark:hover:bg-stone-900"
              >
                <span className="truncate">{skill.title}</span>
                {skill.tags.length > 0 && (
                  <span className="ml-2 shrink-0 text-xs text-stone-400 dark:text-stone-500">
                    {skill.tags[0].name}
                    {skill.tags.length > 1 && ` +${skill.tags.length - 1}`}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 flex items-center gap-2 py-2 text-sm text-stone-400 dark:text-stone-500">
          <Star size={14} weight="regular" /> Star a skill to pin it here
        </p>
      )}
    </section>
  );
}
