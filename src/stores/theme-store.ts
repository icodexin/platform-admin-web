import { create } from "zustand"

type Theme = "light" | "dark"

const STORAGE_KEY = "sys-admin-web.theme"

function getPreferredTheme(): Theme {
  if (typeof window === "undefined") {
    return "light"
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY)
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

interface ThemeState {
  theme: Theme
  hydrateTheme: () => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  hydrateTheme: () => {
    set({ theme: getPreferredTheme() })
  },
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, theme)
    }

    set({ theme })
  },
  toggleTheme: () => {
    const nextTheme = get().theme === "dark" ? "light" : "dark"

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextTheme)
    }

    set({ theme: nextTheme })
  },
}))
