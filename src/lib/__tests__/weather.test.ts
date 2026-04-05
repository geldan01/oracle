import { describe, it, expect, vi, beforeEach } from "vitest";
import { getWeatherDescription, getWeatherIcon, fetchWeather } from "../weather";

describe("getWeatherDescription", () => {
  it("returns description for known WMO codes", () => {
    expect(getWeatherDescription(0)).toBe("Clear sky");
    expect(getWeatherDescription(3)).toBe("Overcast");
    expect(getWeatherDescription(61)).toBe("Slight rain");
    expect(getWeatherDescription(75)).toBe("Heavy snowfall");
    expect(getWeatherDescription(95)).toBe("Thunderstorm");
  });

  it("returns 'Unknown' for unrecognized codes", () => {
    expect(getWeatherDescription(999)).toBe("Unknown");
    expect(getWeatherDescription(-1)).toBe("Unknown");
  });
});

describe("getWeatherIcon", () => {
  it("returns correct emoji for known WMO codes", () => {
    expect(getWeatherIcon(0)).toBe("☀️");
    expect(getWeatherIcon(2)).toBe("⛅");
    expect(getWeatherIcon(3)).toBe("☁️");
    expect(getWeatherIcon(65)).toBe("🌧️");
    expect(getWeatherIcon(75)).toBe("❄️");
    expect(getWeatherIcon(95)).toBe("⛈️");
  });

  it("returns fallback emoji for unknown codes", () => {
    expect(getWeatherIcon(999)).toBe("🌡️");
  });
});

describe("fetchWeather", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("transforms Open-Meteo response into CityWeatherData", async () => {
    const now = new Date();
    const currentHour = now.toISOString().slice(0, 13) + ":00";

    const mockResponse = {
      current: {
        time: currentHour,
        temperature_2m: 22.4,
        apparent_temperature: 20.1,
        relative_humidity_2m: 65,
        wind_speed_10m: 12.3,
        weather_code: 2,
      },
      hourly: {
        time: Array.from({ length: 48 }, (_, i) => {
          const d = new Date(now);
          d.setHours(now.getHours() + i, 0, 0, 0);
          return d.toISOString().slice(0, 16);
        }),
        temperature_2m: Array.from({ length: 48 }, () => 20),
        weather_code: Array.from({ length: 48 }, () => 1),
      },
      daily: {
        time: Array.from({ length: 8 }, (_, i) => {
          const d = new Date(now);
          d.setDate(d.getDate() + i);
          return d.toISOString().slice(0, 10);
        }),
        temperature_2m_max: Array.from({ length: 8 }, () => 25),
        temperature_2m_min: Array.from({ length: 8 }, () => 15),
        weather_code: Array.from({ length: 8 }, () => 0),
        precipitation_probability_max: Array.from({ length: 8 }, () => 10),
      },
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await fetchWeather(48.8566, 2.3522, "Europe/Paris");

    expect(result.current.temperature).toBe(22);
    expect(result.current.humidity).toBe(65);
    expect(result.current.windSpeed).toBe(12);
    expect(result.current.description).toBe("Partly cloudy");
    expect(result.daily.length).toBe(7);
    expect(result.daily[0].temperatureMax).toBe(25);
    expect(result.daily[0].temperatureMin).toBe(15);
  });

  it("throws on API error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    await expect(
      fetchWeather(48.8566, 2.3522, "Europe/Paris"),
    ).rejects.toThrow("Weather API error: 500");
  });
});
