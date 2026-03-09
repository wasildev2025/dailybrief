"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSettings() {
  const settings = await prisma.systemSetting.findMany();
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
}

export async function updateSetting(key: string, value: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateSettings(settings: Record<string, string>) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  for (const [key, value] of Object.entries(settings)) {
    await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  revalidatePath("/dashboard");
  return { success: true };
}
