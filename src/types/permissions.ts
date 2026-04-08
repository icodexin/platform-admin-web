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

export type RabbitMQPermissionBindingId = number

export type RabbitMQBindingCheckType = "user" | "vhost" | "resource" | "topic"

export type RabbitMQBindingResourceType = "exchange" | "queue" | "topic"

export type RabbitMQBindingPermissionLevel = "configure" | "write" | "read"

export type RabbitMQBindingTag =
  | "management"
  | "policymaker"
  | "monitoring"
  | "administrator"

export interface RabbitMQPermissionBinding {
  id: RabbitMQPermissionBindingId
  permission_id?: PermissionId
  check_type: RabbitMQBindingCheckType
  vhost_pattern?: string | null
  resource_type?: RabbitMQBindingResourceType | null
  resource_name_pattern?: string | null
  permission_level?: RabbitMQBindingPermissionLevel | null
  routing_key_pattern?: string | null
  rabbitmq_tag?: RabbitMQBindingTag | null
  created_at?: string
  updated_at?: string
}

export interface ListRabbitMQPermissionBindingsResponse {
  items: RabbitMQPermissionBinding[]
  total: number
}

export interface CreateRabbitMQPermissionBindingPayload {
  check_type: RabbitMQBindingCheckType
  vhost_pattern?: string
  resource_type?: RabbitMQBindingResourceType
  resource_name_pattern?: string
  permission_level?: RabbitMQBindingPermissionLevel
  routing_key_pattern?: string
  rabbitmq_tag?: RabbitMQBindingTag
}

export interface UpdateRabbitMQPermissionBindingPayload {
  check_type?: RabbitMQBindingCheckType
  vhost_pattern?: string
  resource_type?: RabbitMQBindingResourceType
  resource_name_pattern?: string
  permission_level?: RabbitMQBindingPermissionLevel
  routing_key_pattern?: string
  rabbitmq_tag?: RabbitMQBindingTag
}

export type DeletePermissionResponse = DetailResponse | Record<string, unknown>

export type DeleteRabbitMQPermissionBindingResponse = DetailResponse | Record<string, unknown>
