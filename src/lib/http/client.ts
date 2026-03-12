import axios, { AxiosHeaders } from "axios"

import {
  clearStoredAuthTokens,
  getAccessToken,
  getRefreshToken,
  setStoredAuthTokens,
} from "@/lib/auth/token-storage"
import { normalizeApiError } from "@/lib/http/error"
import { FORM_URLENCODED_HEADERS, toFormUrlEncoded } from "@/lib/http/form"
import type { TokenResponse } from "@/types/auth"

interface RetryableRequestConfig {
  _retry?: boolean
  skipAuthRefresh?: boolean
  headers?: AxiosHeaders
  url?: string
}

export const apiClient = axios.create({
  baseURL: "/",
  timeout: 15_000,
  headers: {
    Accept: "application/json",
  },
})

const refreshClient = axios.create({
  baseURL: "/",
  timeout: 15_000,
  headers: {
    Accept: "application/json",
  },
})

let refreshPromise: Promise<string> | null = null

function isAuthRequest(url: string | undefined) {
  if (!url) {
    return false
  }

  return ["/auth/token", "/auth/refresh", "/auth/logout"].some((path) =>
    url.includes(path),
  )
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken()

      if (!refreshToken) {
        clearStoredAuthTokens()
        throw new Error("Missing refresh token")
      }

      const response = await refreshClient.post<TokenResponse>(
        "/auth/refresh",
        toFormUrlEncoded({
          refresh_token: refreshToken,
        }),
        {
          headers: FORM_URLENCODED_HEADERS,
        },
      )

      setStoredAuthTokens({
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
      })

      return response.data.access_token
    })().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken()
  const headers = AxiosHeaders.from(config.headers)

  if (accessToken && !headers.has("Authorization") && !isAuthRequest(config.url)) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  config.headers = headers

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(normalizeApiError(error))
    }

    const status = error.response?.status
    const requestConfig = error.config as RetryableRequestConfig | undefined

    if (
      status !== 401 ||
      !requestConfig ||
      requestConfig._retry ||
      requestConfig.skipAuthRefresh ||
      isAuthRequest(requestConfig.url)
    ) {
      return Promise.reject(normalizeApiError(error))
    }

    try {
      requestConfig._retry = true
      const accessToken = await refreshAccessToken()
      const headers = AxiosHeaders.from(requestConfig.headers)
      headers.set("Authorization", `Bearer ${accessToken}`)
      requestConfig.headers = headers

      return apiClient(requestConfig)
    } catch (refreshError) {
      clearStoredAuthTokens()

      return Promise.reject(normalizeApiError(refreshError))
    }
  },
)
