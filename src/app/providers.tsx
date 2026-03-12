import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { type PropsWithChildren, useEffect, useState } from "react"

import { useThemeStore } from "@/stores/theme-store"

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false,
          },
        },
      }),
  )

  const theme = useThemeStore((state) => state.theme)
  const hydrateTheme = useThemeStore((state) => state.hydrateTheme)

  useEffect(() => {
    hydrateTheme()
  }, [hydrateTheme])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
