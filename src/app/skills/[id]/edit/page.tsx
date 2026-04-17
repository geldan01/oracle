import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SkillForm from "../../skill-form";

interface EditSkillPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSkillPage({ params }: EditSkillPageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const skill = await prisma.skill.findUnique({
    where: { id },
    include: {
      tags: { orderBy: { name: "asc" } },
    },
  });

  if (!skill) notFound();

  const allTags = await prisma.skillTag.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <Link
        href={`/skills/${skill.id}`}
        className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300"
      >
        ← {skill.title}
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
        Edit skill
      </h1>

      <div className="mt-10">
        <SkillForm
          skill={{
            id: skill.id,
            title: skill.title,
            content: skill.content,
            visibility: skill.visibility,
            tags: skill.tags,
          }}
          allTags={allTags.map((t) => t.name)}
        />
      </div>
    </div>
  );
}
