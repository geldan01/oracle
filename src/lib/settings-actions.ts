"use server";

import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
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

export async function uploadDashboardHeroImage(formData: FormData) {
  await requireAdmin();

  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) {
    throw new Error("No image provided");
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid image type. Use JPEG, PNG, or WebP.");
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Image must be under 8MB");
  }

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `hero-${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "system");
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  // Delete the previous image if there was one
  const existing = await prisma.systemSettings.findUnique({
    where: { id: 1 },
    select: { dashboardHeroImage: true },
  });
  if (existing?.dashboardHeroImage) {
    const oldPath = path.join(process.cwd(), "public", existing.dashboardHeroImage);
    try {
      await unlink(oldPath);
    } catch {
      // ignore
    }
  }

  // Reset position to centre on every new upload
  await prisma.systemSettings.upsert({
    where: { id: 1 },
    update: {
      dashboardHeroImage: `/uploads/system/${filename}`,
      dashboardHeroImageX: 50,
      dashboardHeroImageY: 50,
    },
    create: {
      id: 1,
      dashboardHeroImage: `/uploads/system/${filename}`,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function clearDashboardHeroImage() {
  await requireAdmin();

  const existing = await prisma.systemSettings.findUnique({
    where: { id: 1 },
    select: { dashboardHeroImage: true },
  });
  if (existing?.dashboardHeroImage) {
    const oldPath = path.join(process.cwd(), "public", existing.dashboardHeroImage);
    try {
      await unlink(oldPath);
    } catch {
      // ignore
    }
  }

  await prisma.systemSettings.update({
    where: { id: 1 },
    data: {
      dashboardHeroImage: null,
      dashboardHeroImageX: 50,
      dashboardHeroImageY: 50,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function setDashboardHeroImagePosition(x: number, y: number) {
  await requireAdmin();

  const clampedX = Math.max(0, Math.min(100, x));
  const clampedY = Math.max(0, Math.min(100, y));

  await prisma.systemSettings.update({
    where: { id: 1 },
    data: {
      dashboardHeroImageX: clampedX,
      dashboardHeroImageY: clampedY,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
}
