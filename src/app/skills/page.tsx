import { redirect } from "next/navigation";
import Link from "next/link";
import { Star, Plus, CaretRight, Books } from "@phosphor-icons/react/dist/ssr";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface SkillsPageProps {
  searchParams: Promise<{ filter?: string; tag?: string }>;
}

interface SkillRow {
  id: string;
  title: string;
  visibility: "INDIVIDUAL" | "HOUSEHOLD";
  tags: { id: string; name: string }[];
  favouritedBy: { id: string }[];
}

function SkillItem({
  skill,
  showTags = true,
}: {
  skill: SkillRow;
  showTags?: boolean;
}) {
  return (
    <Link
      href={`/skills/${skill.id}`}
      className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-stone-50 dark:hover:bg-stone-900"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {skill.favouritedBy.length > 0 && (
            <Star
              size={12}
              weight="fill"
              className="shrink-0 text-amber-500 dark:text-amber-400"
            />
          )}
          <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
            {skill.title}
          </p>
        </div>
        {showTags && skill.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {skill.tags.map((tag) => (
              <span
                key={tag.id}
                className="text-xs text-stone-400 dark:text-stone-500"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs text-stone-400 dark:text-stone-500">
          {skill.visibility === "HOUSEHOLD" ? "Household" : "Just Me"}
        </span>
        <CaretRight size={12} className="text-stone-300 dark:text-stone-600" />
      </div>
    </Link>
  );
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
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
            Library · {skills.length}
            {activeTag ? ` · #${activeTag}` : ""}
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            <Books size={28} weight="duotone" className="text-fuchsia-500 dark:text-fuchsia-400" />
            Skills
          </h1>
        </div>
        <Link
          href="/skills/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] dark:bg-emerald-500 dark:text-stone-900 dark:hover:bg-emerald-400"
        >
          <Plus size={14} weight="bold" />
          New
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-stone-200 pb-4 dark:border-stone-800">
        <div className="flex items-center gap-1">
          {(
            [
              {
                value: "mine",
                label: "Just Me",
                href: `/skills${activeTag ? `?tag=${encodeURIComponent(activeTag)}` : ""}`,
              },
              {
                value: "household",
                label: "Household",
                href: `/skills?filter=household${activeTag ? `&tag=${encodeURIComponent(activeTag)}` : ""}`,
              },
              {
                value: "all",
                label: "All",
                href: `/skills?filter=all${activeTag ? `&tag=${encodeURIComponent(activeTag)}` : ""}`,
              },
            ] as const
          ).map((btn) => (
            <Link
              key={btn.value}
              href={btn.href}
              className={`rounded-full px-3 py-1 text-sm transition-colors active:scale-[0.98] ${
                filter === btn.value
                  ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
              }`}
            >
              {btn.label}
            </Link>
          ))}
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/skills${filter !== "mine" ? `?filter=${filter}` : ""}`}
              className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                !activeTag
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
              }`}
            >
              all
            </Link>
            {allTags.map((tag) => (
              <Link
                key={tag.id}
                href={`/skills?${filter !== "mine" ? `filter=${filter}&` : ""}tag=${encodeURIComponent(tag.name)}`}
                className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                  activeTag === tag.name
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                }`}
              >
                #{tag.name}
                <span className="ml-1 text-stone-400 tabular-nums dark:text-stone-500">
                  {tag._count.skills}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      <div className="mt-8">
        {skills.length > 0 ? (
          activeTag || !tagGroups ? (
            <ul className="divide-y divide-stone-100 dark:divide-stone-800">
              {skills.map((skill) => (
                <li key={skill.id}>
                  <SkillItem skill={skill} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-10">
              {tagGroups.map(({ tag, skills: tagSkills }) => (
                <section key={tag.id}>
                  <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    #{tag.name}
                  </h2>
                  <ul className="mt-2 divide-y divide-stone-100 dark:divide-stone-800">
                    {tagSkills.map((skill) => (
                      <li key={skill.id}>
                        <SkillItem skill={skill} showTags={false} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              {untaggedSkills.length > 0 && (
                <section>
                  <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    Untagged
                  </h2>
                  <ul className="mt-2 divide-y divide-stone-100 dark:divide-stone-800">
                    {untaggedSkills.map((skill) => (
                      <li key={skill.id}>
                        <SkillItem skill={skill} showTags={false} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )
        ) : (
          <div className="py-16 text-center">
            <p className="text-sm text-stone-400 dark:text-stone-500">
              No skills here yet.
            </p>
            <Link
              href="/skills/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] dark:bg-emerald-500 dark:text-stone-900 dark:hover:bg-emerald-400"
            >
              <Plus size={14} weight="bold" />
              Add your first
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
