"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Role } from "@/generated/prisma";

export async function getSystemSettings() {
  const settings = await prisma.systemSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  return settings;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function setRegistrationEnabled(enabled: boolean) {
  await requireAdmin();

  await prisma.systemSettings.upsert({
    where: { id: 1 },
    update: { registrationEnabled: enabled },
    create: { id: 1, registrationEnabled: enabled },
  });

  revalidatePath("/admin");
  revalidatePath("/register");
  revalidatePath("/login");
}
