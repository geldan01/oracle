import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Star } from "@phosphor-icons/react/dist/ssr";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteSkill, toggleSkillFavourite } from "@/lib/skill-actions";
import SkillContent from "./skill-content";
import VisibilityToggle from "./visibility-toggle";

interface SkillDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SkillDetailPage({
  params,
}: SkillDetailPageProps) {
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
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      {/* Breadcrumb */}
      <Link
        href="/skills"
        className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300"
      >
        ← Skills
      </Link>

      {/* Header */}
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
              {skill.title}
            </h1>
            <form action={toggleFavWithId}>
              <button
                type="submit"
                className="transition-transform hover:scale-110 active:scale-90"
                title={
                  isFavourite ? "Remove from favourites" : "Add to favourites"
                }
              >
                <Star
                  size={22}
                  weight={isFavourite ? "fill" : "regular"}
                  className={
                    isFavourite
                      ? "text-amber-500 dark:text-amber-400"
                      : "text-stone-300 dark:text-stone-600"
                  }
                />
              </button>
            </form>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!isReadOnly ? (
              <VisibilityToggle
                skillId={skill.id}
                visibility={skill.visibility}
              />
            ) : (
              <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                {skill.visibility === "HOUSEHOLD" ? "Household" : "Just Me"}
              </span>
            )}
            {skill.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/skills?tag=${encodeURIComponent(tag.name)}`}
                className="text-xs text-stone-500 transition-colors hover:text-emerald-600 dark:text-stone-400 dark:hover:text-emerald-400"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        </div>

        {!isReadOnly && (
          <div className="flex shrink-0 gap-1">
            <Link
              href={`/skills/${skill.id}/edit`}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98] dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            >
              Edit
            </Link>
            <form action={deleteWithId}>
              <button
                type="submit"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 active:scale-[0.98] dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Delete
              </button>
            </form>
          </div>
        )}
      </div>

      {isReadOnly && (
        <p className="mt-6 text-xs text-stone-500 dark:text-stone-400">
          This skill belongs to another user. View only.
        </p>
      )}

      {/* Content */}
      <div className="mt-10">
        {skill.content ? (
          <SkillContent content={skill.content} />
        ) : (
          <p className="text-sm italic text-stone-400 dark:text-stone-500">
            No content yet.
          </p>
        )}
      </div>

      {/* Metadata */}
      <p className="mt-12 border-t border-stone-200 pt-4 text-xs text-stone-400 dark:border-stone-800 dark:text-stone-500">
        Added by {skill.createdBy.name ?? skill.createdBy.email} ·{" "}
        {skill.createdAt.toLocaleDateString()}
      </p>
    </div>
  );
}
