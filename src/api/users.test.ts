import { beforeEach, describe, expect, it, vi } from "vitest"

const apiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}

vi.mock("@/lib/http", () => ({
  apiClient,
}))

describe("usersApi role bindings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches user role bindings from the new roles endpoint", async () => {
    const responseData = {
      user_id: 12,
      immutable_role: {
        id: 3,
        code: "student",
        name: "学生",
        is_system: true,
      },
      roles: [
        {
          id: 3,
          code: "student",
          name: "学生",
          is_system: true,
        },
        {
          id: 8,
          code: "biz.research.viewer",
          name: "科研只读角色",
          is_system: false,
        },
      ],
    }

    apiClient.get.mockResolvedValueOnce({ data: responseData })

    const { usersApi } = await import("@/api/users")
    const result = await usersApi.getUserRoles(12)

    expect(apiClient.get).toHaveBeenCalledWith("/api/users/12/roles")
    expect(result).toEqual(responseData)
  })

  it("updates user role bindings with the supplemental role ids payload", async () => {
    const payload = {
      role_ids: [8, 9],
    }
    const responseData = {
      user_id: 12,
      immutable_role: {
        id: 2,
        code: "teacher",
        name: "教师",
        is_system: true,
      },
      roles: [
        {
          id: 2,
          code: "teacher",
          name: "教师",
          is_system: true,
        },
        {
          id: 8,
          code: "biz.ops.viewer",
          name: "运维只读角色",
          is_system: false,
        },
        {
          id: 9,
          code: "biz.ops.editor",
          name: "运维编辑角色",
          is_system: false,
        },
      ],
    }

    apiClient.put.mockResolvedValueOnce({ data: responseData })

    const { usersApi } = await import("@/api/users")
    const result = await usersApi.updateUserRoles(12, payload)

    expect(apiClient.put).toHaveBeenCalledWith("/api/users/12/roles", payload)
    expect(result).toEqual(responseData)
  })
})
