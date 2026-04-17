import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ListChecks, CloudSun, Hammer } from "@phosphor-icons/react/dist/ssr";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchWeather } from "@/lib/weather";
import { getSystemSettings } from "@/lib/settings-actions";
import MealPlanWidget from "./meal-plan-widget";
import TvWidget from "./tv-widget";
import SkillsWidget from "./skills-widget";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  const todoLists = await prisma.todoList.findMany({
    where: {
      OR: [
        { preferences: { none: { userId: user.id } } },
        { preferences: { some: { userId: user.id, showOnDashboard: true } } },
      ],
    },
    include: {
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const totalTodos = todoLists.reduce((sum, list) => sum + list.items.length, 0);
  const completedTodos = todoLists.reduce(
    (sum, list) => sum + list.items.filter((item) => item.done).length,
    0
  );

  const primaryCity = await prisma.weatherCity.findFirst({
    where: { isPrimary: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDate = today.toISOString().split("T")[0];

  const todayMealEntries = await prisma.mealPlanEntry.findMany({
    where: { date: today },
    include: { meal: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const upNextEpisodes = await prisma.tvEpisode.findMany({
    where: {
      airDate: { lte: today },
      season: {
        show: {
          status: "WATCHING",
          OR: [{ watchMode: "HOUSEHOLD" }, { ownerId: user.id }],
        },
      },
      watchedBy: { none: { userId: user.id } },
    },
    orderBy: { airDate: "desc" },
    take: 10,
    distinct: ["seasonId"],
    include: {
      season: {
        select: {
          seasonNumber: true,
          show: { select: { id: true, name: true, posterPath: true } },
        },
      },
    },
  });

  const seenShows = new Set<string>();
  const dedupedEpisodes = upNextEpisodes
    .filter((ep) => {
      if (seenShows.has(ep.season.show.id)) return false;
      seenShows.add(ep.season.show.id);
      return true;
    })
    .sort((a, b) => a.season.show.name.localeCompare(b.season.show.name));

  const dashboardSkills = await prisma.skill.findMany({
    where: { favouritedBy: { some: { userId: user.id } } },
    include: { tags: { orderBy: { name: "asc" } } },
    orderBy: { title: "asc" },
  });

  const settings = await getSystemSettings();

  let weatherData = null;
  if (primaryCity) {
    try {
      weatherData = await fetchWeather(
        primaryCity.latitude,
        primaryCity.longitude,
        primaryCity.timezone,
      );
    } catch {
      // Weather API unavailable
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Hero image */}
      {settings.dashboardHeroImage && (
        <div className="relative mb-10 aspect-16/5 w-full overflow-hidden rounded-2xl">
          <Image
            src={settings.dashboardHeroImage}
            alt=""
            fill
            priority
            className="object-cover"
            style={{
              objectPosition: `${settings.dashboardHeroImageX}% ${settings.dashboardHeroImageY}%`,
            }}
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          {/* Gentle fade to background at the bottom so the welcome text breathes */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-background to-transparent" />
        </div>
      )}

      {/* Welcome */}
      <div className="mb-12">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
          {today.toLocaleDateString("en-US", { weekday: "long" })}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          Hello, {user.name ?? user.email}
        </h1>
      </div>

      {/* Bento layout — TV up next is the hero (full width on mobile, 2/3 on desktop) */}
      <div className="grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-3">
        {/* Up Next — featured */}
        <div className="lg:col-span-2">
          <TvWidget episodes={dedupedEpisodes} />
        </div>

        {/* Weather — top right */}
        <section>
          <Link
            href="/weather"
            className="group flex items-center gap-3 transition-opacity hover:opacity-70"
          >
            <CloudSun
              size={20}
              weight="regular"
              className="text-sky-600 dark:text-sky-400"
            />
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
              {primaryCity ? primaryCity.name : "Weather"}
            </h2>
          </Link>

          {primaryCity && weatherData ? (
            <div className="mt-4">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-light tracking-tight text-stone-900 tabular-nums dark:text-stone-100">
                  {weatherData.current.temperature}°
                </span>
                <span className="text-lg text-stone-400 dark:text-stone-500">
                  {weatherData.current.icon}
                </span>
              </div>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                {weatherData.current.description}
              </p>
              {weatherData.daily[0] && (
                <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                  H {weatherData.daily[0].temperatureMax}° · L{" "}
                  {weatherData.daily[0].temperatureMin}° · feels{" "}
                  {weatherData.current.apparentTemperature}°
                </p>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-stone-400 dark:text-stone-500">
              {primaryCity ? "Unable to load weather" : "No cities configured"}
            </p>
          )}
        </section>

        {/* Todos — left side, second row */}
        <section className="lg:col-span-2">
          <Link
            href="/dashboard/todos"
            className="group flex items-center gap-3 transition-opacity hover:opacity-70"
          >
            <ListChecks
              size={20}
              weight="regular"
              className="text-amber-600 dark:text-amber-400"
            />
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
              Shared Todos
            </h2>
            <span className="text-xs text-stone-400 dark:text-stone-500">
              {completedTodos}/{totalTodos}
            </span>
          </Link>

          {todoLists.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {todoLists.slice(0, 4).map((list) => {
                const done = list.items.filter((i) => i.done).length;
                const total = list.items.length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <li key={list.id}>
                    <div className="flex items-center justify-between text-sm text-stone-900 dark:text-stone-100">
                      <span className="truncate">{list.name}</span>
                      <span className="ml-2 shrink-0 text-xs tabular-nums text-stone-400 dark:text-stone-500">
                        {done}/{total}
                      </span>
                    </div>
                    <div className="mt-1.5 h-px w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
                      <div
                        className="h-px bg-amber-500 transition-all dark:bg-amber-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-stone-400 dark:text-stone-500">
              No lists yet
            </p>
          )}
        </section>

        {/* Meal planner — right side, second row */}
        <MealPlanWidget
          todayEntries={todayMealEntries.map((e) => ({
            id: e.id,
            meal: { id: e.meal.id, name: e.meal.name },
          }))}
          todayDate={todayDate}
        />

        {/* Skills — full width below */}
        <div className="lg:col-span-2">
          <SkillsWidget
            skills={dashboardSkills.map((s) => ({
              id: s.id,
              title: s.title,
              visibility: s.visibility,
              tags: s.tags.map((t) => ({ id: t.id, name: t.name })),
            }))}
          />
        </div>

        {/* Projects placeholder — slim */}
        <section>
          <div className="flex items-center gap-3 opacity-50">
            <Hammer
              size={20}
              weight="regular"
              className="text-stone-400 dark:text-stone-500"
            />
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
              Projects
            </h2>
          </div>
          <p className="mt-4 text-sm text-stone-400 dark:text-stone-500">
            Coming soon
          </p>
        </section>
      </div>
    </div>
  );
}
