import { apiClient } from "@/lib/http"
import type {
  CreateRolePayload,
  DeleteRoleResponse,
  ListRolesParams,
  ListRolesResponse,
  Role,
  RoleId,
  UpdateRolePayload,
  UpdateRolePermissionsPayload,
} from "@/types/roles"

async function listRoles(params?: ListRolesParams) {
  const response = await apiClient.get<ListRolesResponse>("/api/roles/", {
    params,
  })

  return response.data
}

async function createRole(payload: CreateRolePayload) {
  const response = await apiClient.post<Role>("/api/roles/", payload)

  return response.data
}

async function getRoleById(roleId: RoleId) {
  const response = await apiClient.get<Role>(`/api/roles/${roleId}`)

  return response.data
}

async function updateRole(roleId: RoleId, payload: UpdateRolePayload) {
  const response = await apiClient.put<Role>(`/api/roles/${roleId}`, payload)

  return response.data
}

async function deleteRole(roleId: RoleId) {
  const response = await apiClient.delete<DeleteRoleResponse>(`/api/roles/${roleId}`)

  return response.data
}

async function getRolePermissions(roleId: RoleId) {
  const response = await apiClient.get<Role>(`/api/roles/${roleId}/permissions`)

  return response.data
}

async function updateRolePermissions(
  roleId: RoleId,
  payload: UpdateRolePermissionsPayload,
) {
  const response = await apiClient.put<Role>(
    `/api/roles/${roleId}/permissions`,
    payload,
  )

  return response.data
}

export const rolesApi = {
  listRoles,
  createRole,
  getRoleById,
  updateRole,
  deleteRole,
  getRolePermissions,
  updateRolePermissions,
}
