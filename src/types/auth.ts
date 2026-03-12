import type { DetailResponse } from "@/types/api"

export interface LoginRequest {
  username: string
  password: string
  grant_type?: "password"
  scope?: string
  client_id?: string | null
  client_secret?: string | null
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface LogoutRequest {
  refresh_token: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: "bearer"
}

export type LogoutResponse = DetailResponse | void
