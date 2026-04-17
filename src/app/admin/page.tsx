import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { promoteToAdmin, demoteToMember } from "@/lib/auth-actions";
import { removeWeatherCity, setPrimaryCity } from "@/lib/weather-actions";
import {
  getSystemSettings,
  setRegistrationEnabled,
} from "@/lib/settings-actions";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma";
import WeatherCitySearch from "@/components/WeatherCitySearch";
import DashboardHeroUpload from "./dashboard-hero-upload";

function ActionLink({
  action,
  label,
  variant = "neutral",
}: {
  action: () => void;
  label: string;
  variant?: "neutral" | "danger" | "primary";
}) {
  const cls = {
    neutral:
      "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100",
    danger:
      "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20",
    primary:
      "text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-900/20",
  }[variant];
  return (
    <form action={action}>
      <button
        type="submit"
        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors active:scale-[0.96] ${cls}`}
      >
        {label}
      </button>
    </form>
  );
}

export default async function AdminPage() {
  const session = await auth();

  if (!session || session.user.role !== Role.ADMIN) {
    redirect("/login");
  }

  const currentUser = session.user;
  const settings = await getSystemSettings();
  const toggleRegistration = setRegistrationEnabled.bind(
    null,
    !settings.registrationEnabled,
  );
  const weatherCities = await prisma.weatherCity.findMany({
    orderBy: { position: "asc" },
  });
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
            Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Settings
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {currentUser.name ?? currentUser.email}
          </p>
        </div>
        <Link
          href="/channels"
          className="rounded-full px-3 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 active:scale-[0.98] dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
        >
          Channels →
        </Link>
      </div>

      {/* System settings */}
      <section className="mt-12">
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          System
        </h2>
        <div className="mt-4 flex items-center justify-between border-b border-stone-200 py-4 dark:border-stone-800">
          <div>
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
              Public registration
            </p>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              {settings.registrationEnabled
                ? "Anyone can create an account from /register."
                : "Registration is closed. Only existing members can sign in."}
            </p>
          </div>
          <form action={toggleRegistration}>
            <button
              type="submit"
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.96] ${
                settings.registrationEnabled
                  ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-stone-900 dark:hover:bg-emerald-400"
              }`}
            >
              {settings.registrationEnabled ? "Disable" : "Enable"}
            </button>
          </form>
        </div>
      </section>

      {/* Dashboard hero image */}
      <section className="mt-12">
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Dashboard image
        </h2>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          Shown at the top of the dashboard above the welcome message. A wide
          (16:5) photo of your family, garden, or home works well.
        </p>
        <div className="mt-4">
          <DashboardHeroUpload
            currentImage={settings.dashboardHeroImage}
            initialX={settings.dashboardHeroImageX}
            initialY={settings.dashboardHeroImageY}
          />
        </div>
      </section>

      {/* Users */}
      <section className="mt-12">
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Members · {users.length}
        </h2>
        <ul className="mt-4 divide-y divide-stone-100 dark:divide-stone-800">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    {user.name ?? "—"}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                      user.role === Role.ADMIN
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "text-stone-500 dark:text-stone-400"
                    }`}
                  >
                    {user.role.toLowerCase()}
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {user.email} · joined{" "}
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {user.role === Role.MEMBER && (
                  <ActionLink
                    action={promoteToAdmin.bind(null, user.id)}
                    label="Promote"
                    variant="primary"
                  />
                )}
                {user.role === Role.ADMIN && user.id !== currentUser.id && (
                  <ActionLink
                    action={demoteToMember.bind(null, user.id)}
                    label="Demote"
                    variant="danger"
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Weather cities */}
      <section className="mt-12">
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Weather cities
        </h2>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          Cities shown on the weather page. The primary one appears on the
          dashboard.
        </p>

        <div className="mt-4">
          <WeatherCitySearch />
        </div>

        {weatherCities.length > 0 && (
          <ul className="mt-4 divide-y divide-stone-100 dark:divide-stone-800">
            {weatherCities.map((city) => (
              <li
                key={city.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                      {city.name}
                    </p>
                    {city.isPrimary && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {city.country}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!city.isPrimary && (
                    <ActionLink
                      action={setPrimaryCity.bind(null, city.id)}
                      label="Make primary"
                      variant="primary"
                    />
                  )}
                  <ActionLink
                    action={removeWeatherCity.bind(null, city.id)}
                    label="Remove"
                    variant="danger"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
