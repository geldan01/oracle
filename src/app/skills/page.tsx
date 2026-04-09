import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface SkillsPageProps {
  searchParams: Promise<{ filter?: string; tag?: string }>;
}

export default async function SkillsPage({ searchParams }: SkillsPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user;
  const { filter = "mine", tag: activeTag } = await searchParams;

  const ownershipFilter =
    filter === "all"
      ? {}
      : filter === "household"
        ? { visibility: "HOUSEHOLD" as const }
        : { visibility: "INDIVIDUAL" as const, ownerId: user.id };

  const skills = await prisma.skill.findMany({
    where: {
      ...ownershipFilter,
      ...(activeTag ? { tags: { some: { name: activeTag } } } : {}),
    },
    include: {
      tags: { orderBy: { name: "asc" } },
      createdBy: { select: { name: true, email: true } },
      favouritedBy: { where: { userId: user.id } },
    },
    orderBy: { title: "asc" },
  });

  const allTags = await prisma.skillTag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { skills: true } } },
  });

  // Group skills by tag for display
  const untaggedSkills = skills.filter((s) => s.tags.length === 0);
  const tagGroups = activeTag
    ? null
    : allTags
        .map((tag) => ({
          tag,
          skills: skills.filter((s) => s.tags.some((t) => t.id === tag.id)),
        }))
        .filter((g) => g.skills.length > 0);

  return (
    <div className="flex min-h-full flex-1 items-start justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-fuchsia-200/60 pb-6 dark:border-fuchsia-900/30">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-stone-500 transition-colors hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
            >
              &larr; Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-fuchsia-900 dark:text-fuchsia-100">
              Skills
            </h1>
            <p className="text-sm text-fuchsia-600/70 dark:text-fuchsia-400/60">
              {skills.length} {skills.length === 1 ? "skill" : "skills"}
              {activeTag ? ` tagged "${activeTag}"` : ""}
            </p>
          </div>
          <Link
            href="/skills/new"
            className="rounded-lg bg-fuchsia-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-fuchsia-800"
          >
            + New Skill
          </Link>
        </div>

        {/* Ownership filter */}
        <div className="inline-flex rounded-lg border border-fuchsia-200 dark:border-fuchsia-800">
          {[
            { value: "mine", label: "Just Me", href: `/skills${activeTag ? `?tag=${encodeURIComponent(activeTag)}` : ""}` },
            { value: "household", label: "Household", href: `/skills?filter=household${activeTag ? `&tag=${encodeURIComponent(activeTag)}` : ""}` },
            { value: "all", label: "All", href: `/skills?filter=all${activeTag ? `&tag=${encodeURIComponent(activeTag)}` : ""}` },
          ].map((btn, i) => (
            <Link
              key={btn.value}
              href={btn.href}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                i > 0 ? "border-l border-fuchsia-200 dark:border-fuchsia-800" : ""
              } ${i === 0 ? "rounded-l-lg" : ""} ${i === 2 ? "rounded-r-lg" : ""} ${
                filter === btn.value
                  ? "bg-fuchsia-500 text-white dark:bg-fuchsia-500"
                  : "bg-stone-100 text-fuchsia-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-fuchsia-300 dark:hover:bg-stone-700"
              }`}
            >
              {btn.label}
            </Link>
          ))}
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/skills${filter !== "mine" ? `?filter=${filter}` : ""}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !activeTag
                  ? "bg-fuchsia-500 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
              }`}
            >
              All tags
            </Link>
            {allTags.map((tag) => (
              <Link
                key={tag.id}
                href={`/skills?${filter !== "mine" ? `filter=${filter}&` : ""}tag=${encodeURIComponent(tag.name)}`}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeTag === tag.name
                    ? "bg-fuchsia-500 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                }`}
              >
                {tag.name} ({tag._count.skills})
              </Link>
            ))}
          </div>
        )}

        {/* Skill list */}
        {skills.length > 0 ? (
          activeTag || !tagGroups ? (
            // Flat list when filtering by tag
            <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200/80 bg-white dark:divide-stone-700/60 dark:border-stone-700/60 dark:bg-stone-900">
              {skills.map((skill) => (
                <li key={skill.id}>
                  <Link
                    href={`/skills/${skill.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {skill.favouritedBy.length > 0 && (
                          <span className="shrink-0 text-sm text-fuchsia-500">{"\u2605"}</span>
                        )}
                        <p className="truncate font-medium text-stone-800 dark:text-stone-100">
                          {skill.title}
                        </p>
                      </div>
                      {skill.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {skill.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400"
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-stone-400 dark:text-stone-500">
                        {skill.visibility === "HOUSEHOLD" ? "Household" : "Just Me"}
                      </span>
                      <span className="text-stone-300 dark:text-stone-600">&rsaquo;</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            // Grouped by tag
            <div className="space-y-6">
              {tagGroups.map(({ tag, skills: tagSkills }) => (
                <section key={tag.id}>
                  <h2 className="mb-2 text-sm font-semibold text-fuchsia-700 uppercase tracking-wide dark:text-fuchsia-400">
                    {tag.name}
                  </h2>
                  <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200/80 bg-white dark:divide-stone-700/60 dark:border-stone-700/60 dark:bg-stone-900">
                    {tagSkills.map((skill) => (
                      <li key={skill.id}>
                        <Link
                          href={`/skills/${skill.id}`}
                          className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20"
                        >
                          <div className="flex min-w-0 items-center gap-1.5">
                            {skill.favouritedBy.length > 0 && (
                              <span className="shrink-0 text-sm text-fuchsia-500">{"\u2605"}</span>
                            )}
                            <p className="truncate font-medium text-stone-800 dark:text-stone-100">
                              {skill.title}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-xs text-stone-400 dark:text-stone-500">
                              {skill.visibility === "HOUSEHOLD" ? "Household" : "Just Me"}
                            </span>
                            <span className="text-stone-300 dark:text-stone-600">&rsaquo;</span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              {untaggedSkills.length > 0 && (
                <section>
                  <h2 className="mb-2 text-sm font-semibold text-stone-500 uppercase tracking-wide dark:text-stone-400">
                    Untagged
                  </h2>
                  <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200/80 bg-white dark:divide-stone-700/60 dark:border-stone-700/60 dark:bg-stone-900">
                    {untaggedSkills.map((skill) => (
                      <li key={skill.id}>
                        <Link
                          href={`/skills/${skill.id}`}
                          className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20"
                        >
                          <div className="flex min-w-0 items-center gap-1.5">
                            {skill.favouritedBy.length > 0 && (
                              <span className="shrink-0 text-sm text-fuchsia-500">{"\u2605"}</span>
                            )}
                            <p className="truncate font-medium text-stone-800 dark:text-stone-100">
                              {skill.title}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-xs text-stone-400 dark:text-stone-500">
                              {skill.visibility === "HOUSEHOLD" ? "Household" : "Just Me"}
                            </span>
                            <span className="text-stone-300 dark:text-stone-600">&rsaquo;</span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 py-16 dark:border-stone-700">
            <p className="text-lg text-stone-400 dark:text-stone-500">
              No skills yet
            </p>
            <p className="mt-1 text-sm text-stone-300 dark:text-stone-600">
              Add your first skill to get started
            </p>
            <Link
              href="/skills/new"
              className="mt-4 rounded-lg bg-fuchsia-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-fuchsia-800"
            >
              + New Skill
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
