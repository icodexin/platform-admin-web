import axios, { AxiosHeaders } from "axios"

import { getAccessToken } from "@/lib/auth/token-storage"
import { normalizeApiError } from "@/lib/http/error"

export const apiClient = axios.create({
  baseURL: "/",
  timeout: 15_000,
  headers: {
    Accept: "application/json",
  },
})

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken()
  const headers = AxiosHeaders.from(config.headers)

  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  config.headers = headers

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(normalizeApiError(error)),
)
