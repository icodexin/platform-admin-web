import axios from "axios"

export interface ApiErrorPayload {
  detail?: string
  message?: string
  errors?: unknown
  [key: string]: unknown
}

export class ApiRequestError extends Error {
  status?: number
  code?: string
  payload?: ApiErrorPayload | unknown

  constructor(message: string, options?: {
    status?: number
    code?: string
    payload?: ApiErrorPayload | unknown
  }) {
    super(message)
    this.name = "ApiRequestError"
    this.status = options?.status
    this.code = options?.code
    this.payload = options?.payload
  }
}

function getErrorMessage(payload: ApiErrorPayload | unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback
  }

  if ("detail" in payload && typeof payload.detail === "string" && payload.detail.trim()) {
    return payload.detail
  }

  if ("message" in payload && typeof payload.message === "string" && payload.message.trim()) {
    return payload.message
  }

  return fallback
}

export function normalizeApiError(error: unknown) {
  if (error instanceof ApiRequestError) {
    return error
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const payload = error.response?.data as ApiErrorPayload | undefined
    const fallback = error.message || "Request failed"

    return new ApiRequestError(getErrorMessage(payload, fallback), {
      status,
      code: error.code,
      payload,
    })
  }

  if (error instanceof Error) {
    return new ApiRequestError(error.message)
  }

  return new ApiRequestError("Unknown request error")
}
