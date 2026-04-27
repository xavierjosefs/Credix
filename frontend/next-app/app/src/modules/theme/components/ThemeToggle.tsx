"use client";

import { useTheme } from "@/app/src/modules/theme/components/ThemeProvider";

export default function ThemeToggle({
  iconOnly,
  className = "",
}: {
  iconOnly?: boolean;
  className?: string;
}) {
  const { theme, hydrated, toggleTheme } = useTheme();
  const isDark = hydrated ? theme === "dark" : false;
  const buttonLabel = hydrated
    ? isDark
      ? "Activar modo claro"
      : "Activar modo oscuro"
    : "Cambiar tema";
  const buttonTitle = hydrated ? (isDark ? "Modo claro" : "Modo oscuro") : "Cambiar tema";
  const buttonText = hydrated ? (isDark ? "Modo claro" : "Modo oscuro") : "Cambiar tema";

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    toggleTheme({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        iconOnly
          ? `theme-toggle-icon ${className}`.trim()
          : `theme-toggle-inline ${className}`.trim()
      }
      aria-label={buttonLabel}
      title={buttonTitle}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      {iconOnly ? null : <span>{buttonText}</span>}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12.7 2.05A8.5 8.5 0 1 0 21.95 11 7.5 7.5 0 0 1 12.7 2.05Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 4a1 1 0 0 1 1 1v1.25a1 1 0 1 1-2 0V5a1 1 0 0 1 1-1Zm0 12.75a1 1 0 0 1 1 1V20a1 1 0 1 1-2 0v-2.25a1 1 0 0 1 1-1ZM5 11a1 1 0 1 1 0 2H2.75a1 1 0 1 1 0-2Zm16.25 0a1 1 0 1 1 0 2H19a1 1 0 1 1 0-2ZM6.34 5.93a1 1 0 0 1 1.41 0l.89.88a1 1 0 1 1-1.42 1.42l-.88-.89a1 1 0 0 1 0-1.41Zm10.13 10.12a1 1 0 0 1 1.41 0l.89.88a1 1 0 0 1-1.42 1.42l-.88-.89a1 1 0 0 1 0-1.41ZM18.76 5.93a1 1 0 0 1 0 1.41l-.88.89a1 1 0 1 1-1.42-1.42l.89-.88a1 1 0 0 1 1.41 0ZM8.64 16.05a1 1 0 0 1 0 1.41l-.89.89a1 1 0 0 1-1.41-1.42l.88-.88a1 1 0 0 1 1.42 0ZM12 8a4 4 0 1 1-4 4 4 4 0 0 1 4-4Z" />
    </svg>
  );
}
