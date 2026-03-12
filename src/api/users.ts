import { apiClient } from "@/lib/http"
import type { DetailResponse } from "@/types/api"
import type {
  CreateUserPayload,
  ListUsersParams,
  ListUsersResponse,
  UpdateUserPayload,
  User,
  UserId,
} from "@/types/users"

async function createUser(payload: CreateUserPayload) {
  const response = await apiClient.post<User>("/api/users/", payload)

  return response.data
}

async function listUsers(params?: ListUsersParams) {
  const response = await apiClient.get<ListUsersResponse>("/api/users/", {
    params,
  })

  return response.data
}

async function getCurrentUser() {
  const response = await apiClient.get<User>("/api/users/me")

  return response.data
}

async function getUserById(userId: UserId) {
  const response = await apiClient.get<User>(`/api/users/${userId}`)

  return response.data
}

async function updateUser(userId: UserId, payload: UpdateUserPayload) {
  const response = await apiClient.put<User>(`/api/users/${userId}`, payload)

  return response.data
}

async function deactivateCurrentUser() {
  const response = await apiClient.post<DetailResponse>("/api/users/me/deactivate")

  return response.data
}

async function deactivateUser(userId: UserId) {
  const response = await apiClient.post<DetailResponse>(
    `/api/users/${userId}/deactivate`,
  )

  return response.data
}

export const usersApi = {
  createUser,
  listUsers,
  getCurrentUser,
  getUserById,
  updateUser,
  deactivateCurrentUser,
  deactivateUser,
}
