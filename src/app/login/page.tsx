import { prisma } from "@/lib/prisma";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const userCount = await prisma.user.count();
  let showRegister = true;
  if (userCount > 0) {
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (settings && !settings.registrationEnabled) {
      showRegister = false;
    }
  }

  return <LoginForm showRegister={showRegister} />;
}
