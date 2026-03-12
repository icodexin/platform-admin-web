import { apiClient } from "@/lib/http"
import type {
  CreatePermissionPayload,
  DeletePermissionResponse,
  ListPermissionsParams,
  ListPermissionsResponse,
  Permission,
  PermissionId,
  UpdatePermissionPayload,
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

export const permissionsApi = {
  listPermissions,
  createPermission,
  getPermissionById,
  updatePermission,
  deletePermission,
}
