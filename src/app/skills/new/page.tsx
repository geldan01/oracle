import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SkillForm from "../skill-form";

export default async function NewSkillPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const allTags = await prisma.skillTag.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex min-h-full flex-1 items-start justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-2xl space-y-6">
        <div>
          <Link
            href="/skills"
            className="text-sm text-stone-500 transition-colors hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
          >
            &larr; Skills
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-stone-800 dark:text-stone-100">
            New Skill
          </h1>
        </div>

        <SkillForm allTags={allTags.map((t) => t.name)} />
      </div>
    </div>
  );
}
