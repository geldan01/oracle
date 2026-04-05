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

export async function createTodoList(formData: FormData) {
  const user = await requireAuth();
  const name = formData.get("name") as string | null;

  if (!name?.trim()) {
    throw new Error("List name is required");
  }

  const list = await prisma.todoList.create({
    data: {
      name: name.trim(),
      createdById: user.id,
    },
  });

  const allUsers = await prisma.user.findMany({ select: { id: true } });

  if (allUsers.length > 0) {
    await prisma.userTodoListPreference.createMany({
      data: allUsers.map((u) => ({
        userId: u.id,
        listId: list.id,
        showOnDashboard: true,
      })),
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/todos");
}

export async function renameTodoList(listId: string, formData: FormData) {
  await requireAuth();
  const name = formData.get("name") as string | null;

  if (!name?.trim()) {
    throw new Error("List name is required");
  }

  await prisma.todoList.update({
    where: { id: listId },
    data: { name: name.trim() },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/todos");
}

export async function deleteTodoList(listId: string) {
  await requireAuth();

  await prisma.todoList.delete({
    where: { id: listId },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/todos");
  redirect("/dashboard/todos");
}

export async function addTodoItem(listId: string, formData: FormData) {
  const user = await requireAuth();
  const text = formData.get("text") as string | null;

  if (!text?.trim()) {
    throw new Error("Item text is required");
  }

  const itemCount = await prisma.todoItem.count({
    where: { listId },
  });

  await prisma.todoItem.create({
    data: {
      text: text.trim(),
      done: false,
      position: itemCount,
      listId,
      createdById: user.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/todos/${listId}`);
}

export async function toggleTodoItem(itemId: string) {
  await requireAuth();

  const item = await prisma.todoItem.findUnique({
    where: { id: itemId },
  });

  if (!item) {
    throw new Error("Item not found");
  }

  await prisma.todoItem.update({
    where: { id: itemId },
    data: { done: !item.done },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/todos/${item.listId}`);
}

export async function deleteTodoItem(itemId: string) {
  await requireAuth();

  const item = await prisma.todoItem.findUnique({
    where: { id: itemId },
  });

  if (!item) {
    throw new Error("Item not found");
  }

  await prisma.todoItem.delete({
    where: { id: itemId },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/todos/${item.listId}`);
}

export async function toggleListOnDashboard(listId: string) {
  const user = await requireAuth();

  const existing = await prisma.userTodoListPreference.findUnique({
    where: {
      userId_listId: {
        userId: user.id,
        listId,
      },
    },
  });

  if (existing) {
    await prisma.userTodoListPreference.update({
      where: { id: existing.id },
      data: { showOnDashboard: !existing.showOnDashboard },
    });
  } else {
    await prisma.userTodoListPreference.create({
      data: {
        userId: user.id,
        listId,
        showOnDashboard: false,
      },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/todos");
}
