const ACCESS_TOKEN_KEY = "sys-admin-web.access-token"
const REFRESH_TOKEN_KEY = "sys-admin-web.refresh-token"

export interface AuthTokenSnapshot {
  accessToken: string | null
  refreshToken: string | null
}

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

export function getAccessToken() {
  if (!hasStorage()) {
    return null
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  if (!hasStorage()) {
    return null
  }

  return window.localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getStoredAuthTokens(): AuthTokenSnapshot {
  return {
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
  }
}

export function setStoredAuthTokens(tokens: Partial<AuthTokenSnapshot>) {
  if (!hasStorage()) {
    return
  }

  if (tokens.accessToken !== undefined) {
    if (tokens.accessToken) {
      window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
    } else {
      window.localStorage.removeItem(ACCESS_TOKEN_KEY)
    }
  }

  if (tokens.refreshToken !== undefined) {
    if (tokens.refreshToken) {
      window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
    } else {
      window.localStorage.removeItem(REFRESH_TOKEN_KEY)
    }
  }
}

export function clearStoredAuthTokens() {
  if (!hasStorage()) {
    return
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
}
