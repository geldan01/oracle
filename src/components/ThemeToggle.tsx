"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "@phosphor-icons/react";

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        className="rounded-full p-2 text-stone-600 dark:text-stone-400"
        aria-label="Toggle theme"
      >
        <span className="block h-5 w-5" />
      </button>
    );
  }

  function cycle() {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  }

  const label =
    theme === "system" ? "System" : theme === "light" ? "Light" : "Dark";

  return (
    <button
      onClick={cycle}
      className="rounded-full p-2 text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 active:scale-[0.95] dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
      aria-label="Toggle theme"
      title={`Theme: ${label}`}
    >
      {resolvedTheme === "dark" ? (
        <Moon size={18} weight="regular" />
      ) : (
        <Sun size={18} weight="regular" />
      )}
    </button>
  );
}
