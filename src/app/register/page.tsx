import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RegisterForm from "./register-form";

export default async function RegisterPage() {
  // Always allow the first user to bootstrap; afterwards honor the setting
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (settings && !settings.registrationEnabled) {
      redirect("/login");
    }
  }

  return <RegisterForm />;
}
