import { redirect } from "next/navigation";
import Link from "next/link";
import { Drop, CloudSun } from "@phosphor-icons/react/dist/ssr";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchWeather, type CityWeatherData } from "@/lib/weather";

export const revalidate = 900;

interface CityWithWeather {
  id: string;
  name: string;
  country: string;
  isPrimary: boolean;
  weather: CityWeatherData | null;
}

export default async function WeatherPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const cities = await prisma.weatherCity.findMany({
    orderBy: { position: "asc" },
  });

  if (cities.length === 0) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
        <Link
          href="/dashboard"
          className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-4 flex items-center gap-3 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          <CloudSun size={28} weight="duotone" className="text-sky-500 dark:text-sky-400" />
          Weather
        </h1>
        <p className="mt-12 text-sm text-stone-400 dark:text-stone-500">
          No cities configured. An admin can add cities from the Admin panel.
        </p>
      </div>
    );
  }

  const citiesWithWeather: CityWithWeather[] = await Promise.all(
    cities.map(async (city) => {
      let weather: CityWeatherData | null = null;
      try {
        weather = await fetchWeather(
          city.latitude,
          city.longitude,
          city.timezone,
        );
      } catch {
        // API unavailable for this city
      }
      return {
        id: city.id,
        name: city.name,
        country: city.country,
        isPrimary: city.isPrimary,
        weather,
      };
    }),
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <Link
        href="/dashboard"
        className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400 transition-colors hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300"
      >
        ← Dashboard
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
        Weather
      </h1>

      <div className="mt-12 space-y-16">
        {citiesWithWeather.map((city) => (
          <section key={city.id}>
            <div className="flex items-baseline gap-3">
              <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                {city.name}, {city.country}
              </h2>
              {city.isPrimary && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  Primary
                </span>
              )}
            </div>

            {city.weather ? (
              <div className="mt-4 space-y-8">
                {/* Current */}
                <div className="flex items-start justify-between border-b border-stone-200 pb-6 dark:border-stone-800">
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-6xl font-light tracking-tight text-stone-900 tabular-nums dark:text-stone-100">
                        {city.weather.current.temperature}°
                      </span>
                      <span className="text-3xl text-stone-400 dark:text-stone-500">
                        {city.weather.current.icon}
                      </span>
                    </div>
                    <p className="mt-2 text-base text-stone-600 dark:text-stone-300">
                      {city.weather.current.description}
                    </p>
                  </div>
                  <div className="space-y-1 text-right text-xs text-stone-500 tabular-nums dark:text-stone-400">
                    <p>Feels {city.weather.current.apparentTemperature}°</p>
                    <p>Humidity {city.weather.current.humidity}%</p>
                    <p>Wind {city.weather.current.windSpeed} km/h</p>
                  </div>
                </div>

                {/* Hourly */}
                {city.weather.hourly.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                      Today
                    </h3>
                    <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
                      {city.weather.hourly.map((hour, i) => (
                        <div
                          key={i}
                          className="flex shrink-0 flex-col items-center gap-1"
                        >
                          <span className="text-xs text-stone-500 tabular-nums dark:text-stone-400">
                            {hour.time}
                          </span>
                          <span className="text-base">{hour.icon}</span>
                          <span className="text-sm font-medium text-stone-900 tabular-nums dark:text-stone-100">
                            {hour.temperature}°
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Daily */}
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
                    7-day forecast
                  </h3>
                  <ul className="mt-3 divide-y divide-stone-100 dark:divide-stone-800">
                    {city.weather.daily.map((day, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-4 py-2.5"
                      >
                        <span className="w-12 text-sm font-medium text-stone-900 dark:text-stone-100">
                          {day.dayName}
                        </span>
                        <span className="w-6 text-center text-base">
                          {day.icon}
                        </span>
                        <span className="flex-1 text-sm text-stone-500 dark:text-stone-400">
                          {day.description}
                        </span>
                        {day.precipitationProbability > 0 && (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 tabular-nums dark:text-emerald-400">
                            <Drop size={11} weight="fill" />
                            {day.precipitationProbability}%
                          </span>
                        )}
                        <span className="w-20 text-right text-sm tabular-nums">
                          <span className="font-medium text-stone-900 dark:text-stone-100">
                            {day.temperatureMax}°
                          </span>
                          <span className="ml-1 text-stone-400 dark:text-stone-500">
                            {day.temperatureMin}°
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-stone-400 dark:text-stone-500">
                Unable to load weather for this city.
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
