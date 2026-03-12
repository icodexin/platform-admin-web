import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"

import { usersApi } from "@/api"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  clearStoredAuthTokens,
  getAccessToken,
} from "@/lib/auth/token-storage"
import { useAuthStore } from "@/stores/auth-store"

export function RequireAuth() {
  const location = useLocation()
  const accessToken = getAccessToken()
  const currentUser = useAuthStore((state) => state.currentUser)
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser)
  const clearAuthState = useAuthStore((state) => state.clearAuthState)

  const currentUserQuery = useQuery({
    queryKey: ["auth", "current-user"],
    queryFn: usersApi.getCurrentUser,
    enabled: Boolean(accessToken),
    initialData: currentUser ?? undefined,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (currentUserQuery.data) {
      setCurrentUser(currentUserQuery.data)
    }
  }, [currentUserQuery.data, setCurrentUser])

  if (!accessToken) {
    return <Navigate replace to="/login" state={{ from: location }} />
  }

  if (currentUserQuery.isError) {
    clearStoredAuthTokens()
    clearAuthState()

    return <Navigate replace to="/login" state={{ from: location }} />
  }

  if (currentUserQuery.isPending && !currentUser) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4 py-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return <Outlet />
}
