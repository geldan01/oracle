import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPrisma, mockAuth } = vi.hoisted(() => ({
  mockPrisma: {
    todoList: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    todoItem: {
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    userTodoListPreference: {
      createMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
  mockAuth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

import {
  createTodoList,
  renameTodoList,
  deleteTodoList,
  addTodoItem,
  toggleTodoItem,
  deleteTodoItem,
  toggleListOnDashboard,
} from "../todo-actions";

function makeFormData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

const mockUser = { id: "user-1", email: "a@b.com", role: "MEMBER" };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: mockUser });
});

describe("requireAuth (via createTodoList)", () => {
  it("throws Unauthorized when no session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(createTodoList(makeFormData({ name: "List" }))).rejects.toThrow(
      "Unauthorized"
    );
  });

  it("throws Unauthorized when session has no user", async () => {
    mockAuth.mockResolvedValue({ user: null });
    await expect(createTodoList(makeFormData({ name: "List" }))).rejects.toThrow(
      "Unauthorized"
    );
  });
});

describe("createTodoList", () => {
  it("throws when name is empty", async () => {
    await expect(createTodoList(makeFormData({ name: "" }))).rejects.toThrow(
      "List name is required"
    );
  });

  it("throws when name is whitespace only", async () => {
    await expect(createTodoList(makeFormData({ name: "   " }))).rejects.toThrow(
      "List name is required"
    );
  });

  it("creates list with trimmed name and sets up preferences", async () => {
    mockPrisma.todoList.create.mockResolvedValue({ id: "list-1" });
    mockPrisma.user.findMany.mockResolvedValue([{ id: "user-1" }, { id: "user-2" }]);
    mockPrisma.userTodoListPreference.createMany.mockResolvedValue({});

    await createTodoList(makeFormData({ name: "  Groceries  " }));

    expect(mockPrisma.todoList.create).toHaveBeenCalledWith({
      data: {
        name: "Groceries",
        createdById: "user-1",
      },
    });

    expect(mockPrisma.userTodoListPreference.createMany).toHaveBeenCalledWith({
      data: [
        { userId: "user-1", listId: "list-1", showOnDashboard: true },
        { userId: "user-2", listId: "list-1", showOnDashboard: true },
      ],
    });
  });

  it("skips preference creation when no users exist", async () => {
    mockPrisma.todoList.create.mockResolvedValue({ id: "list-1" });
    mockPrisma.user.findMany.mockResolvedValue([]);

    await createTodoList(makeFormData({ name: "List" }));

    expect(mockPrisma.userTodoListPreference.createMany).not.toHaveBeenCalled();
  });
});

describe("renameTodoList", () => {
  it("throws when name is empty", async () => {
    await expect(renameTodoList("list-1", makeFormData({ name: "" }))).rejects.toThrow(
      "List name is required"
    );
  });

  it("updates list with trimmed name", async () => {
    mockPrisma.todoList.update.mockResolvedValue({});

    await renameTodoList("list-1", makeFormData({ name: "  New Name  " }));

    expect(mockPrisma.todoList.update).toHaveBeenCalledWith({
      where: { id: "list-1" },
      data: { name: "New Name" },
    });
  });
});

describe("deleteTodoList", () => {
  it("deletes and redirects to todos page", async () => {
    mockPrisma.todoList.delete.mockResolvedValue({});

    await expect(deleteTodoList("list-1")).rejects.toThrow(
      "NEXT_REDIRECT:/dashboard/todos"
    );

    expect(mockPrisma.todoList.delete).toHaveBeenCalledWith({
      where: { id: "list-1" },
    });
  });
});

describe("addTodoItem", () => {
  it("throws when text is empty", async () => {
    await expect(addTodoItem("list-1", makeFormData({ text: "" }))).rejects.toThrow(
      "Item text is required"
    );
  });

  it("throws when text is whitespace", async () => {
    await expect(addTodoItem("list-1", makeFormData({ text: "   " }))).rejects.toThrow(
      "Item text is required"
    );
  });

  it("creates item with correct position based on count", async () => {
    mockPrisma.todoItem.count.mockResolvedValue(5);
    mockPrisma.todoItem.create.mockResolvedValue({});

    await addTodoItem("list-1", makeFormData({ text: "  Buy milk  " }));

    expect(mockPrisma.todoItem.create).toHaveBeenCalledWith({
      data: {
        text: "Buy milk",
        done: false,
        position: 5,
        listId: "list-1",
        createdById: "user-1",
      },
    });
  });

  it("sets position 0 for first item", async () => {
    mockPrisma.todoItem.count.mockResolvedValue(0);
    mockPrisma.todoItem.create.mockResolvedValue({});

    await addTodoItem("list-1", makeFormData({ text: "First" }));

    expect(mockPrisma.todoItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ position: 0 }),
      })
    );
  });
});

describe("toggleTodoItem", () => {
  it("throws when item not found", async () => {
    mockPrisma.todoItem.findUnique.mockResolvedValue(null);
    await expect(toggleTodoItem("item-1")).rejects.toThrow("Item not found");
  });

  it("toggles done from false to true", async () => {
    mockPrisma.todoItem.findUnique.mockResolvedValue({
      id: "item-1",
      done: false,
      listId: "list-1",
    });
    mockPrisma.todoItem.update.mockResolvedValue({});

    await toggleTodoItem("item-1");

    expect(mockPrisma.todoItem.update).toHaveBeenCalledWith({
      where: { id: "item-1" },
      data: { done: true },
    });
  });

  it("toggles done from true to false", async () => {
    mockPrisma.todoItem.findUnique.mockResolvedValue({
      id: "item-1",
      done: true,
      listId: "list-1",
    });
    mockPrisma.todoItem.update.mockResolvedValue({});

    await toggleTodoItem("item-1");

    expect(mockPrisma.todoItem.update).toHaveBeenCalledWith({
      where: { id: "item-1" },
      data: { done: false },
    });
  });
});

describe("deleteTodoItem", () => {
  it("throws when item not found", async () => {
    mockPrisma.todoItem.findUnique.mockResolvedValue(null);
    await expect(deleteTodoItem("item-1")).rejects.toThrow("Item not found");
  });

  it("deletes the item", async () => {
    mockPrisma.todoItem.findUnique.mockResolvedValue({
      id: "item-1",
      listId: "list-1",
    });
    mockPrisma.todoItem.delete.mockResolvedValue({});

    await deleteTodoItem("item-1");

    expect(mockPrisma.todoItem.delete).toHaveBeenCalledWith({
      where: { id: "item-1" },
    });
  });
});

describe("toggleListOnDashboard", () => {
  it("toggles existing preference from true to false", async () => {
    mockPrisma.userTodoListPreference.findUnique.mockResolvedValue({
      id: "pref-1",
      showOnDashboard: true,
    });
    mockPrisma.userTodoListPreference.update.mockResolvedValue({});

    await toggleListOnDashboard("list-1");

    expect(mockPrisma.userTodoListPreference.update).toHaveBeenCalledWith({
      where: { id: "pref-1" },
      data: { showOnDashboard: false },
    });
  });

  it("toggles existing preference from false to true", async () => {
    mockPrisma.userTodoListPreference.findUnique.mockResolvedValue({
      id: "pref-1",
      showOnDashboard: false,
    });
    mockPrisma.userTodoListPreference.update.mockResolvedValue({});

    await toggleListOnDashboard("list-1");

    expect(mockPrisma.userTodoListPreference.update).toHaveBeenCalledWith({
      where: { id: "pref-1" },
      data: { showOnDashboard: true },
    });
  });

  it("creates new preference set to false when none exists", async () => {
    mockPrisma.userTodoListPreference.findUnique.mockResolvedValue(null);
    mockPrisma.userTodoListPreference.create.mockResolvedValue({});

    await toggleListOnDashboard("list-1");

    expect(mockPrisma.userTodoListPreference.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        listId: "list-1",
        showOnDashboard: false,
      },
    });
  });
});
