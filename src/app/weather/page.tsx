import { redirect } from "next/navigation";
import Link from "next/link";
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
      <div className="flex min-h-full flex-1 items-start justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-5xl space-y-6">
          <div className="border-b border-sky-200/60 pb-6 dark:border-sky-900/30">
            <Link
              href="/dashboard"
              className="text-sm text-sky-600 hover:text-sky-500 dark:text-sky-400"
            >
              &larr; Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-sky-900 dark:text-sky-100">
              Weather
            </h1>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-sky-300/60 py-16 dark:border-sky-700/40">
            <p className="text-lg font-medium text-sky-400 dark:text-sky-500">
              No cities configured
            </p>
            <p className="mt-2 text-sm text-sky-300 dark:text-sky-600">
              An admin can add cities from the Admin panel.
            </p>
          </div>
        </div>
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
    <div className="flex min-h-full flex-1 items-start justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-5xl space-y-6">
        <div className="border-b border-sky-200/60 pb-6 dark:border-sky-900/30">
          <Link
            href="/dashboard"
            className="text-sm text-sky-600 hover:text-sky-500 dark:text-sky-400"
          >
            &larr; Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-sky-900 dark:text-sky-100">
            Weather
          </h1>
        </div>

        <div className="space-y-8">
          {citiesWithWeather.map((city) => (
            <div
              key={city.id}
              className="overflow-hidden rounded-2xl border border-sky-200/80 bg-linear-to-br from-sky-50 to-cyan-50 shadow-sm dark:border-sky-900/40 dark:from-sky-950/40 dark:to-cyan-950/30"
            >
              {/* City Header */}
              <div className="border-b border-sky-200/60 px-6 py-4 dark:border-sky-800/40">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-sky-900 dark:text-sky-100">
                    {city.name}
                  </h2>
                  <span className="text-sm text-sky-600/70 dark:text-sky-400/60">
                    {city.country}
                  </span>
                  {city.isPrimary && (
                    <span className="rounded-full bg-sky-200/80 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-800/50 dark:text-sky-300">
                      Primary
                    </span>
                  )}
                </div>
              </div>

              {city.weather ? (
                <div className="p-6 space-y-6">
                  {/* Current Conditions */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-baseline gap-3">
                        <span className="text-5xl font-light text-sky-900 dark:text-sky-100">
                          {city.weather.current.temperature}°C
                        </span>
                        <span className="text-4xl">
                          {city.weather.current.icon}
                        </span>
                      </div>
                      <p className="mt-2 text-base text-sky-800 dark:text-sky-200">
                        {city.weather.current.description}
                      </p>
                    </div>
                    <div className="text-right text-sm text-sky-700/80 dark:text-sky-300/60 space-y-1">
                      <p>
                        Feels like{" "}
                        {city.weather.current.apparentTemperature}°C
                      </p>
                      <p>Humidity {city.weather.current.humidity}%</p>
                      <p>Wind {city.weather.current.windSpeed} km/h</p>
                    </div>
                  </div>

                  {/* Rest of Today — Hourly */}
                  {city.weather.hourly.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sky-700/60 dark:text-sky-400/50">
                        Rest of Today
                      </h3>
                      <div className="flex gap-1 overflow-x-auto pb-2">
                        {city.weather.hourly.map((hour, i) => (
                          <div
                            key={i}
                            className="flex flex-shrink-0 flex-col items-center rounded-xl bg-sky-100/60 px-3 py-2 dark:bg-sky-900/30"
                          >
                            <span className="text-xs text-sky-600 dark:text-sky-400">
                              {hour.time}
                            </span>
                            <span className="my-1 text-lg">{hour.icon}</span>
                            <span className="text-sm font-medium text-sky-900 dark:text-sky-100">
                              {hour.temperature}°
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 7-Day Forecast */}
                  <div>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sky-700/60 dark:text-sky-400/50">
                      7-Day Forecast
                    </h3>
                    <div className="space-y-1">
                      {city.weather.daily.map((day, i) => (
                        <div
                          key={i}
                          className="flex items-center rounded-lg px-3 py-2 transition-colors hover:bg-sky-100/50 dark:hover:bg-sky-900/20"
                        >
                          <span className="w-12 text-sm font-medium text-sky-800 dark:text-sky-200">
                            {day.dayName}
                          </span>
                          <span className="w-8 text-center text-lg">
                            {day.icon}
                          </span>
                          <span className="ml-2 flex-1 text-sm text-sky-700/70 dark:text-sky-300/60">
                            {day.description}
                          </span>
                          {day.precipitationProbability > 0 && (
                            <span className="mr-4 text-xs text-sky-500 dark:text-sky-500">
                              💧 {day.precipitationProbability}%
                            </span>
                          )}
                          <span className="w-16 text-right text-sm">
                            <span className="font-medium text-sky-900 dark:text-sky-100">
                              {day.temperatureMax}°
                            </span>
                            <span className="text-sky-500 dark:text-sky-500">
                              {" "}
                              {day.temperatureMin}°
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-sm font-medium text-sky-400 dark:text-sky-500">
                    Unable to load weather data
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
