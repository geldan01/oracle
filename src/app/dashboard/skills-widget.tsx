import Link from "next/link";

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
    <Link
      href="/skills"
      className="group relative block overflow-hidden rounded-2xl border border-fuchsia-200/80 bg-linear-to-br from-fuchsia-50 to-purple-50 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-fuchsia-900/40 dark:from-fuchsia-950/40 dark:to-purple-950/30"
    >
      <div className="absolute top-0 right-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full bg-fuchsia-200/30 dark:bg-fuchsia-800/20" />
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-500/15 text-2xl ring-1 ring-fuchsia-500/20 dark:bg-fuchsia-400/10 dark:ring-fuchsia-400/20">
          <span role="img" aria-label="Skills">&#128218;</span>
        </div>
        <div>
          <h2 className="font-semibold text-fuchsia-900 dark:text-fuchsia-100">
            Skills
          </h2>
          <p className="text-xs text-fuchsia-700/60 dark:text-fuchsia-300/50">
            {skills.length} {skills.length === 1 ? "favourite" : "favourites"}
          </p>
        </div>
      </div>

      {skills.length > 0 ? (
        <ul className="mt-5 space-y-2">
          {skills.slice(0, 5).map((skill) => (
            <li
              key={skill.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="truncate text-fuchsia-800 dark:text-fuchsia-200">
                {skill.title}
              </span>
              {skill.tags.length > 0 && (
                <span className="ml-2 shrink-0 text-xs text-fuchsia-600/50 dark:text-fuchsia-400/40">
                  {skill.tags[0].name}
                  {skill.tags.length > 1 && ` +${skill.tags.length - 1}`}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-sm text-fuchsia-600/50 dark:text-fuchsia-400/40">
          No favourites yet. Star a skill to pin it here.
        </p>
      )}

      <p className="mt-5 text-xs font-medium text-fuchsia-600/50 transition-colors group-hover:text-fuchsia-700 dark:text-fuchsia-400/40 dark:group-hover:text-fuchsia-300">
        View all &rarr;
      </p>
    </Link>
  );
}
