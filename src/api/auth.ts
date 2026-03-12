import { apiClient, FORM_URLENCODED_HEADERS, toFormUrlEncoded } from "@/lib/http"
import type {
  LoginRequest,
  LogoutRequest,
  LogoutResponse,
  RefreshTokenRequest,
  TokenResponse,
} from "@/types/auth"

async function login(payload: LoginRequest) {
  const response = await apiClient.post<TokenResponse>(
    "/auth/token",
    toFormUrlEncoded(payload),
    {
      headers: FORM_URLENCODED_HEADERS,
    },
  )

  return response.data
}

async function refreshToken(payload: RefreshTokenRequest) {
  const response = await apiClient.post<TokenResponse>(
    "/auth/refresh",
    toFormUrlEncoded(payload),
    {
      headers: FORM_URLENCODED_HEADERS,
    },
  )

  return response.data
}

async function logout(payload: LogoutRequest) {
  const response = await apiClient.post<LogoutResponse>(
    "/auth/logout",
    toFormUrlEncoded(payload),
    {
      headers: FORM_URLENCODED_HEADERS,
    },
  )

  return response.data
}

export const authApi = {
  login,
  refreshToken,
  logout,
}
