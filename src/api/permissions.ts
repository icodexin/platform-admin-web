import { apiClient } from "@/lib/http"
import type {
  CreatePermissionPayload,
  CreateRabbitMQPermissionBindingPayload,
  DeletePermissionResponse,
  DeleteRabbitMQPermissionBindingResponse,
  ListPermissionsParams,
  ListPermissionsResponse,
  ListRabbitMQPermissionBindingsResponse,
  Permission,
  PermissionId,
  RabbitMQPermissionBinding,
  RabbitMQPermissionBindingId,
  UpdatePermissionPayload,
  UpdateRabbitMQPermissionBindingPayload,
} from "@/types/permissions"

async function listPermissions(params?: ListPermissionsParams) {
  const response = await apiClient.get<ListPermissionsResponse>("/api/permissions/", {
    params,
  })

  return response.data
}

async function createPermission(payload: CreatePermissionPayload) {
  const response = await apiClient.post<Permission>("/api/permissions/", payload)

  return response.data
}

async function getPermissionById(permissionId: PermissionId) {
  const response = await apiClient.get<Permission>(`/api/permissions/${permissionId}`)

  return response.data
}

async function updatePermission(
  permissionId: PermissionId,
  payload: UpdatePermissionPayload,
) {
  const response = await apiClient.put<Permission>(
    `/api/permissions/${permissionId}`,
    payload,
  )

  return response.data
}

async function deletePermission(permissionId: PermissionId) {
  const response = await apiClient.delete<DeletePermissionResponse>(
    `/api/permissions/${permissionId}`,
  )

  return response.data
}

async function listRabbitMQPermissionBindings(permissionId: PermissionId) {
  const response = await apiClient.get<ListRabbitMQPermissionBindingsResponse>(
    `/api/permissions/${permissionId}/rabbitmq-bindings`,
  )

  return response.data
}

async function createRabbitMQPermissionBinding(
  permissionId: PermissionId,
  payload: CreateRabbitMQPermissionBindingPayload,
) {
  const response = await apiClient.post<RabbitMQPermissionBinding>(
    `/api/permissions/${permissionId}/rabbitmq-bindings`,
    payload,
  )

  return response.data
}

async function getRabbitMQPermissionBindingById(
  permissionId: PermissionId,
  bindingId: RabbitMQPermissionBindingId,
) {
  const response = await apiClient.get<RabbitMQPermissionBinding>(
    `/api/permissions/${permissionId}/rabbitmq-bindings/${bindingId}`,
  )

  return response.data
}

async function updateRabbitMQPermissionBinding(
  permissionId: PermissionId,
  bindingId: RabbitMQPermissionBindingId,
  payload: UpdateRabbitMQPermissionBindingPayload,
) {
  const response = await apiClient.put<RabbitMQPermissionBinding>(
    `/api/permissions/${permissionId}/rabbitmq-bindings/${bindingId}`,
    payload,
  )

  return response.data
}

async function deleteRabbitMQPermissionBinding(
  permissionId: PermissionId,
  bindingId: RabbitMQPermissionBindingId,
) {
  const response = await apiClient.delete<DeleteRabbitMQPermissionBindingResponse>(
    `/api/permissions/${permissionId}/rabbitmq-bindings/${bindingId}`,
  )

  return response.data
}

export const permissionsApi = {
  listPermissions,
  createPermission,
  getPermissionById,
  updatePermission,
  deletePermission,
  listRabbitMQPermissionBindings,
  createRabbitMQPermissionBinding,
  getRabbitMQPermissionBindingById,
  updateRabbitMQPermissionBinding,
  deleteRabbitMQPermissionBinding,
}
