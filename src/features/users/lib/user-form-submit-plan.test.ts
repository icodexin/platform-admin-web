import { describe, expect, it } from "vitest"

import {
  buildUserFormSubmissionPlan,
  getFormValuesFromUser,
} from "@/features/users/lib/user-form-submit-plan"
import type { User } from "@/types/users"

const teacherUser: User = {
  id: 11,
  user_type: "teacher",
  unified_id: "teacher001",
  name: "张老师",
  gender: "male",
  birthdate: "1990-01-01",
  is_active: true,
  roles: ["teacher", "biz.ops.viewer"],
  department: "物理学院",
  title: "副教授",
}

describe("buildUserFormSubmissionPlan", () => {
  it("does not submit profile update when only custom roles change", () => {
    const values = {
      ...getFormValuesFromUser(teacherUser),
      role_ids: [9],
    }

    const plan = buildUserFormSubmissionPlan({
      user: teacherUser,
      values,
      currentRoleIds: [8],
      passwordTouched: false,
    })

    expect(plan.shouldUpdateProfile).toBe(false)
    expect(plan.shouldUpdateRoles).toBe(true)
  })

  it("ignores autofilled password when the field was not touched", () => {
    const values = {
      ...getFormValuesFromUser(teacherUser),
      password: "ccnu@1234",
      role_ids: [],
    }

    const plan = buildUserFormSubmissionPlan({
      user: teacherUser,
      values,
      currentRoleIds: [],
      passwordTouched: false,
    })

    expect(plan.shouldUpdateProfile).toBe(false)
    expect(plan.profilePayload).not.toHaveProperty("password")
  })

  it("submits profile update when the password was intentionally changed", () => {
    const values = {
      ...getFormValuesFromUser(teacherUser),
      password: "ccnu@1234",
      role_ids: [],
    }

    const plan = buildUserFormSubmissionPlan({
      user: teacherUser,
      values,
      currentRoleIds: [],
      passwordTouched: true,
    })

    expect(plan.shouldUpdateProfile).toBe(true)
    expect(plan.profilePayload).toHaveProperty("password", "ccnu@1234")
  })

  it("falls back to original select values when blank strings slip into the form state", () => {
    const values = {
      ...getFormValuesFromUser(teacherUser),
      gender: "" as never,
      role_ids: [8],
    }

    const plan = buildUserFormSubmissionPlan({
      user: teacherUser,
      values,
      currentRoleIds: [8],
      passwordTouched: false,
    })

    expect(plan.shouldUpdateProfile).toBe(false)
    expect(plan.profilePayload).toMatchObject({
      unified_id: "teacher001",
      name: "张老师",
      gender: "male",
    })
  })
})
