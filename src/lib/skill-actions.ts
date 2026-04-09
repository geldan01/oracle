"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function createSkill(formData: FormData) {
  const user = await requireAuth();
  const title = formData.get("title") as string | null;
  const content = formData.get("content") as string | null;
  const visibility = formData.get("visibility") as string | null;
  const tagNames = formData.getAll("tags") as string[];

  if (!title?.trim()) {
    throw new Error("Skill title is required");
  }

  const visibilityValue =
    visibility === "HOUSEHOLD" ? "HOUSEHOLD" : "INDIVIDUAL";

  const skill = await prisma.skill.create({
    data: {
      title: title.trim(),
      content: content?.trim() || null,
      visibility: visibilityValue,
      ownerId: visibilityValue === "INDIVIDUAL" ? user.id : null,
      createdById: user.id,
      tags: {
        connectOrCreate: tagNames
          .filter((t) => t.trim())
          .map((t) => ({
            where: { name: t.trim().toLowerCase() },
            create: { name: t.trim().toLowerCase() },
          })),
      },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/skills");
  redirect(`/skills/${skill.id}`);
}

export async function updateSkill(skillId: string, formData: FormData) {
  await requireAuth();
  const title = formData.get("title") as string | null;
  const content = formData.get("content") as string | null;
  const visibility = formData.get("visibility") as string | null;
  const tagNames = formData.getAll("tags") as string[];

  if (!title?.trim()) {
    throw new Error("Skill title is required");
  }

  const visibilityValue =
    visibility === "HOUSEHOLD" ? "HOUSEHOLD" : "INDIVIDUAL";

  const user = await requireAuth();

  await prisma.skill.update({
    where: { id: skillId },
    data: {
      title: title.trim(),
      content: content?.trim() || null,
      visibility: visibilityValue,
      ownerId: visibilityValue === "INDIVIDUAL" ? user.id : null,
      tags: {
        set: [],
        connectOrCreate: tagNames
          .filter((t) => t.trim())
          .map((t) => ({
            where: { name: t.trim().toLowerCase() },
            create: { name: t.trim().toLowerCase() },
          })),
      },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/skills");
  revalidatePath(`/skills/${skillId}`);
  redirect(`/skills/${skillId}`);
}

export async function deleteSkill(skillId: string) {
  await requireAuth();
  await prisma.skill.delete({ where: { id: skillId } });

  revalidatePath("/dashboard");
  revalidatePath("/skills");
  redirect("/skills");
}

export async function updateSkillVisibility(skillId: string, visibility: "INDIVIDUAL" | "HOUSEHOLD") {
  const user = await requireAuth();

  await prisma.skill.update({
    where: { id: skillId },
    data: {
      visibility,
      ownerId: visibility === "INDIVIDUAL" ? user.id : null,
    },
  });

  revalidatePath(`/skills/${skillId}`);
  revalidatePath("/skills");
  revalidatePath("/dashboard");
}

export async function toggleSkillFavourite(skillId: string) {
  const user = await requireAuth();

  const existing = await prisma.userSkillFavourite.findUnique({
    where: { skillId_userId: { skillId, userId: user.id } },
  });

  if (existing) {
    await prisma.userSkillFavourite.delete({ where: { id: existing.id } });
  } else {
    await prisma.userSkillFavourite.create({
      data: { skillId, userId: user.id },
    });
  }

  revalidatePath(`/skills/${skillId}`);
  revalidatePath("/skills");
  revalidatePath("/dashboard");
}
