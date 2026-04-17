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
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <Link
        href="/skills"
        className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300"
      >
        ← Skills
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
        New skill
      </h1>

      <div className="mt-10">
        <SkillForm allTags={allTags.map((t) => t.name)} />
      </div>
    </div>
  );
}
