// Open-Meteo API client — free, no API key required

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code: string;
  timezone: string;
  admin1?: string;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  description: string;
  icon: string;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  weatherCode: number;
  icon: string;
}

export interface DailyForecast {
  date: string;
  dayName: string;
  temperatureMax: number;
  temperatureMin: number;
  weatherCode: number;
  description: string;
  icon: string;
  precipitationProbability: number;
}

export interface CityWeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snowfall",
  73: "Moderate snowfall",
  75: "Heavy snowfall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

const WMO_ICONS: Record<number, string> = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌧️",
  56: "🌧️",
  57: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  66: "🧊",
  67: "🧊",
  71: "🌨️",
  73: "🌨️",
  75: "❄️",
  77: "❄️",
  80: "🌦️",
  81: "🌧️",
  82: "🌧️",
  85: "🌨️",
  86: "❄️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️",
};

export function getWeatherDescription(code: number): string {
  return WMO_DESCRIPTIONS[code] ?? "Unknown";
}

export function getWeatherIcon(code: number): string {
  return WMO_ICONS[code] ?? "🌡️";
}

export async function searchCities(query: string): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=5&language=en&format=json`;
  const res = await fetch(url);

  if (!res.ok) return [];

  const data = await res.json();
  return (data.results ?? []) as GeocodingResult[];
}

export async function fetchWeather(
  latitude: number,
  longitude: number,
  timezone: string,
): Promise<CityWeatherData> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
    hourly: "temperature_2m,weather_code",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone,
    forecast_days: "8",
  });

  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
    { next: { revalidate: 900 } },
  );

  if (!res.ok) {
    throw new Error(`Weather API error: ${res.status}`);
  }

  const data = await res.json();

  const current: CurrentWeather = {
    temperature: Math.round(data.current.temperature_2m),
    apparentTemperature: Math.round(data.current.apparent_temperature),
    humidity: data.current.relative_humidity_2m,
    windSpeed: Math.round(data.current.wind_speed_10m),
    weatherCode: data.current.weather_code,
    description: getWeatherDescription(data.current.weather_code),
    icon: getWeatherIcon(data.current.weather_code),
  };

  // Get current hour index to filter "rest of today" hours
  const now = new Date(data.current.time);
  const currentHourIndex = data.hourly.time.findIndex(
    (t: string) => new Date(t) >= now,
  );
  const endOfDayIndex = data.hourly.time.findIndex(
    (t: string) =>
      new Date(t).getDate() !== now.getDate() && new Date(t) > now,
  );
  const todayEnd = endOfDayIndex === -1 ? 24 : endOfDayIndex;

  const hourly: HourlyForecast[] = data.hourly.time
    .slice(currentHourIndex, todayEnd)
    .map((time: string, i: number) => {
      const idx = currentHourIndex + i;
      return {
        time: new Date(time).toLocaleTimeString("en-US", {
          hour: "numeric",
          hour12: true,
        }),
        temperature: Math.round(data.hourly.temperature_2m[idx]),
        weatherCode: data.hourly.weather_code[idx],
        icon: getWeatherIcon(data.hourly.weather_code[idx]),
      };
    });

  // Skip today (index 0), take next 7 days
  const daily: DailyForecast[] = data.daily.time
    .slice(1, 8)
    .map((date: string, i: number) => {
      const idx = i + 1;
      const d = new Date(date + "T12:00:00");
      return {
        date,
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        temperatureMax: Math.round(data.daily.temperature_2m_max[idx]),
        temperatureMin: Math.round(data.daily.temperature_2m_min[idx]),
        weatherCode: data.daily.weather_code[idx],
        description: getWeatherDescription(data.daily.weather_code[idx]),
        icon: getWeatherIcon(data.daily.weather_code[idx]),
        precipitationProbability:
          data.daily.precipitation_probability_max[idx] ?? 0,
      };
    });

  return { current, hourly, daily };
}
