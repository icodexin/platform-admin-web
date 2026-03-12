const ACCESS_TOKEN_KEY = "sys-admin-web.access-token"
const REFRESH_TOKEN_KEY = "sys-admin-web.refresh-token"
const AUTH_TOKENS_CHANGED_EVENT = "sys-admin-web:auth-tokens-changed"

export interface AuthTokenSnapshot {
  accessToken: string | null
  refreshToken: string | null
}

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function emitAuthTokensChanged() {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new CustomEvent(AUTH_TOKENS_CHANGED_EVENT))
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

  emitAuthTokensChanged()
}

export function clearStoredAuthTokens() {
  if (!hasStorage()) {
    return
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  emitAuthTokensChanged()
}

export function subscribeAuthTokenChanges(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined
  }

  window.addEventListener(AUTH_TOKENS_CHANGED_EVENT, listener)

  return () => {
    window.removeEventListener(AUTH_TOKENS_CHANGED_EVENT, listener)
  }
}
