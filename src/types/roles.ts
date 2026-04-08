import type { DetailResponse, PaginatedResponse } from "@/types/api"

export type RoleId = number

export interface RolePermissionSummary {
  id: number
  code: string
  name: string
}

export interface Role {
  id: RoleId
  code: string
  name: string
  permissions: RolePermissionSummary[]
  permission_count: number
  user_count: number
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface ListRolesParams {
  page?: number
  page_size?: number
  keyword?: string
}

export interface ListRolesResponse extends PaginatedResponse<Role> {
  items: Role[]
  total: number
  page: number
  page_size: number
}

export interface CreateRolePayload {
  code: string
  name: string
  permission_ids?: number[]
}

export interface UpdateRolePayload {
  code?: string | null
  name?: string | null
  permission_ids?: number[] | null
}

export interface UpdateRolePermissionsPayload {
  permission_ids: number[]
}

export type DeleteRoleResponse = DetailResponse | Record<string, unknown>
