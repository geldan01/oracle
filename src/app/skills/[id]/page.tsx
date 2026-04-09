import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteSkill, toggleSkillFavourite } from "@/lib/skill-actions";
import SkillContent from "./skill-content";
import VisibilityToggle from "./visibility-toggle";

interface SkillDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SkillDetailPage({ params }: SkillDetailPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const skill = await prisma.skill.findUnique({
    where: { id },
    include: {
      tags: { orderBy: { name: "asc" } },
      createdBy: { select: { name: true, email: true } },
      favouritedBy: { where: { userId: session.user.id } },
    },
  });

  if (!skill) notFound();

  const isFavourite = skill.favouritedBy.length > 0;
  const isOwner = !skill.ownerId || skill.ownerId === session.user.id;
  const isReadOnly = skill.visibility === "INDIVIDUAL" && !isOwner;

  const deleteWithId = deleteSkill.bind(null, skill.id);
  const toggleFavWithId = toggleSkillFavourite.bind(null, skill.id);

  return (
    <div className="flex min-h-full flex-1 items-start justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-3xl space-y-8">
        {/* Header */}
        <div>
          <Link
            href="/skills"
            className="text-sm text-stone-500 transition-colors hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
          >
            &larr; Skills
          </Link>

          <div className="mt-3 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
                  {skill.title}
                </h1>
                <form action={toggleFavWithId}>
                  <button
                    type="submit"
                    className="text-xl transition-colors hover:scale-110"
                    title={isFavourite ? "Remove from favourites" : "Add to favourites"}
                  >
                    <span className={isFavourite ? "text-fuchsia-500" : "text-stone-300 dark:text-stone-600"}>
                      {isFavourite ? "\u2605" : "\u2606"}
                    </span>
                  </button>
                </form>
              </div>

              <div className="mt-1">
                {!isReadOnly ? (
                  <VisibilityToggle skillId={skill.id} visibility={skill.visibility} />
                ) : (
                  <span className="inline-block rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                    {skill.visibility === "HOUSEHOLD" ? "Household" : "Just Me"}
                  </span>
                )}
              </div>

              {/* Tags */}
              {skill.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {skill.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      href={`/skills?tag=${encodeURIComponent(tag.name)}`}
                      className="rounded-full bg-fuchsia-100 px-2.5 py-0.5 text-xs font-medium text-fuchsia-600 transition-colors hover:bg-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-400 dark:hover:bg-fuchsia-900/50"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {!isReadOnly && (
              <div className="flex gap-2">
                <Link
                  href={`/skills/${skill.id}/edit`}
                  className="rounded-lg bg-stone-200 px-3 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-300 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600"
                >
                  Edit
                </Link>
                <form action={deleteWithId}>
                  <button
                    type="submit"
                    className="rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                  >
                    Delete
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {isReadOnly && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
            This skill belongs to another user. You can view but not edit it.
          </div>
        )}

        {/* Content */}
        {skill.content ? (
          <SkillContent content={skill.content} />
        ) : (
          <p className="text-sm text-stone-400 italic dark:text-stone-500">
            No content yet.
          </p>
        )}

        {/* Metadata */}
        <p className="text-xs text-stone-400">
          Added by {skill.createdBy.name ?? skill.createdBy.email} &middot;{" "}
          {skill.createdAt.toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
