"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("deutschmate-theme");
    const next = saved === "dark" || (!saved && matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("deutschmate-theme", next ? "dark" : "light");
  }

  return <button type="button" className="icon-button" onClick={toggle} aria-label="Toggle color theme" aria-pressed={dark}>{dark ? "☀" : "☾"}</button>;
}
