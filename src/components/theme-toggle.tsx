"use client";

import * as React from "react";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const isDark = theme === "dark";

  return (
    <Button
      variant="outline"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="flex items-center gap-2 px-3 py-2"
    >
      {isDark ? (
        <>
          <MoonIcon className="h-5 w-5" />
          <span>Dark</span>
        </>
      ) : (
        <>
          <SunIcon className="h-5 w-5" />
          <span>Light</span>
        </>
      )}
    </Button>
  );
}
