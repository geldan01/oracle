export default function Footer() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <footer className="mt-auto border-t border-stone-200/80 px-4 py-5 text-center text-xs text-stone-400 sm:px-6 dark:border-stone-800/80 dark:text-stone-500">
      {today}
    </footer>
  );
}
