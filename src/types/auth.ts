import { Role } from "@/generated/prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};
