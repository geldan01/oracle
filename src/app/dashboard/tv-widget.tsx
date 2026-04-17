import Link from "next/link";
import { Television } from "@phosphor-icons/react/dist/ssr";

interface UpNextEpisode {
  id: string;
  episodeNumber: number;
  name: string | null;
  airDate: Date | null;
  season: {
    seasonNumber: number;
    show: { id: string; name: string; posterPath: string | null };
  };
}

export default function TvWidget({ episodes }: { episodes: UpNextEpisode[] }) {
  return (
    <section>
      <Link
        href="/tv"
        className="group flex items-center gap-3 transition-opacity hover:opacity-70"
      >
        <Television size={20} weight="regular" className="text-violet-600 dark:text-violet-400" />
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500 dark:text-stone-400">
          Up Next
        </h2>
      </Link>

      {episodes.length > 0 ? (
        <ul className="mt-4 divide-y divide-stone-100 dark:divide-stone-800">
          {episodes.slice(0, 5).map((ep) => (
            <li key={ep.id}>
              <Link
                href={`/tv/${ep.season.show.id}`}
                className="flex items-center gap-3 py-3 transition-colors hover:bg-stone-50 active:scale-[0.998] dark:hover:bg-stone-900"
              >
                {ep.season.show.posterPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://image.tmdb.org/t/p/w92${ep.season.show.posterPath}`}
                    alt=""
                    className="h-12 w-8 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-8 shrink-0 items-center justify-center rounded bg-stone-100 dark:bg-stone-800">
                    <Television size={14} className="text-stone-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                    {ep.season.show.name}
                  </p>
                  <p className="truncate text-xs text-stone-500 dark:text-stone-400">
                    S{ep.season.seasonNumber}E{ep.episodeNumber}
                    {ep.name ? ` · ${ep.name}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 py-2 text-sm text-stone-400 dark:text-stone-500">
          All caught up
        </p>
      )}
    </section>
  );
}
