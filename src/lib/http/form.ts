export const FORM_URLENCODED_HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded",
} as const

type FormValue = string | number | boolean | null | undefined

export function toFormUrlEncoded<T extends object>(payload: T) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(payload as Record<string, FormValue>)) {
    if (value === null || value === undefined) {
      continue
    }

    params.append(key, String(value))
  }

  return params
}
