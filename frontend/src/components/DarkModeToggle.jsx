import { useEffect, useState } from "react";

const THEME_KEY = "theme";

function DarkModeToggle() {
  const [theme, setTheme] = useState(localStorage.getItem(THEME_KEY) || "light");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
      aria-label="Toggle dark mode"
      type="button"
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}

export default DarkModeToggle;
