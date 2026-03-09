"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  return prisma.user.findMany({
    orderBy: { displayOrder: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      displayOrder: true,
      isActive: true,
      createdAt: true,
    },
  });
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "MEMBER";
  displayOrder: number;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) throw new Error("A user with this email already exists");

  const passwordHash = await bcrypt.hash(data.password, 12);

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      displayOrder: data.displayOrder,
    },
  });

  revalidatePath("/dashboard/admin/users");
  return { success: true };
}

export async function updateUser(
  userId: string,
  data: {
    name?: string;
    email?: string;
    role?: "ADMIN" | "MEMBER";
    displayOrder?: number;
    isActive?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email, id: { not: userId } },
    });
    if (existing) throw new Error("A user with this email already exists");
  }

  await prisma.user.update({
    where: { id: userId },
    data,
  });

  revalidatePath("/dashboard/admin/users");
  return { success: true };
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { success: true };
}

export async function toggleUserActive(userId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  if (user.id === session.user.id) {
    throw new Error("Cannot deactivate yourself");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });

  revalidatePath("/dashboard/admin/users");
  return { success: true, isActive: !user.isActive };
}
