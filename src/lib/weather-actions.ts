"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { searchCities as searchCitiesApi } from "@/lib/weather";
import type { GeocodingResult } from "@/lib/weather";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function searchCitiesAction(
  query: string,
): Promise<GeocodingResult[]> {
  await requireAdmin();
  return searchCitiesApi(query);
}

export async function addWeatherCity(data: {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}) {
  await requireAdmin();

  const count = await prisma.weatherCity.count();

  await prisma.weatherCity.create({
    data: {
      ...data,
      isPrimary: count === 0,
      position: count,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/weather");
  revalidatePath("/admin");
}

export async function removeWeatherCity(cityId: string) {
  await requireAdmin();

  const city = await prisma.weatherCity.findUnique({ where: { id: cityId } });
  if (!city) return;

  await prisma.weatherCity.delete({ where: { id: cityId } });

  // If removed city was primary, reassign to first remaining
  if (city.isPrimary) {
    const first = await prisma.weatherCity.findFirst({
      orderBy: { position: "asc" },
    });
    if (first) {
      await prisma.weatherCity.update({
        where: { id: first.id },
        data: { isPrimary: true },
      });
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/weather");
  revalidatePath("/admin");
}

export async function setPrimaryCity(cityId: string) {
  await requireAdmin();

  await prisma.$transaction([
    prisma.weatherCity.updateMany({
      where: { isPrimary: true },
      data: { isPrimary: false },
    }),
    prisma.weatherCity.update({
      where: { id: cityId },
      data: { isPrimary: true },
    }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/weather");
  revalidatePath("/admin");
}
