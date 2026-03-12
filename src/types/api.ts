export interface DetailResponse {
  detail: string
  [key: string]: unknown
}

export interface PaginatedResponse<T> {
  items?: T[]
  results?: T[]
  total?: number
  count?: number
  page?: number
  page_size?: number
  pages?: number
  [key: string]: unknown
}
