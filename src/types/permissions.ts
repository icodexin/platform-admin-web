import type { DetailResponse, PaginatedResponse } from "@/types/api"

export type PermissionId = number

export interface Permission {
  id: PermissionId
  code: string
  name: string
  role_count: number
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface ListPermissionsParams {
  page?: number
  page_size?: number
  keyword?: string
}

export interface ListPermissionsResponse extends PaginatedResponse<Permission> {
  items: Permission[]
  total: number
  page: number
  page_size: number
}

export interface CreatePermissionPayload {
  code: string
  name: string
}

export interface UpdatePermissionPayload {
  code?: string | null
  name?: string | null
}

export type DeletePermissionResponse = DetailResponse | Record<string, unknown>
