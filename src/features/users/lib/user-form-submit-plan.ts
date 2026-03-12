import type { UpdateUserPayload, User } from "@/types/users"

export interface UserFormSubmissionValues {
  user_type: User["user_type"]
  unified_id: string
  name: string
  password: string
  gender: User["gender"]
  birthdate: string
  student_type: "undergraduate" | "master" | "phd"
  college: string
  major: string
  enrollment_year: string
  department: string
  title: string
  role_ids: number[]
}

interface SubmissionPlanOptions {
  passwordTouched?: boolean
}

function toOptionalText(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function toOptionalNumber(value: string) {
  const trimmed = value.trim()
  return trimmed ? Number(trimmed) : null
}

export function getFormValuesFromUser(user: User): UserFormSubmissionValues {
  return {
    user_type: user.user_type,
    unified_id: user.unified_id,
    name: user.name,
    password: "",
    gender: user.gender ?? "unknown",
    birthdate: user.birthdate ?? "",
    student_type:
      user.user_type === "student" ? user.student_type ?? "undergraduate" : "undergraduate",
    college: user.user_type === "student" ? user.college ?? "" : "",
    major: user.user_type === "student" ? user.major ?? "" : "",
    enrollment_year:
      user.user_type === "student" && user.enrollment_year
        ? String(user.enrollment_year)
        : "",
    department: user.user_type === "teacher" ? user.department ?? "" : "",
    title: user.user_type === "teacher" ? user.title ?? "" : "",
    role_ids: [],
  }
}

export function normalizeUserFormValues(
  values: UserFormSubmissionValues,
  user?: User,
): UserFormSubmissionValues {
  return {
    ...values,
    user_type: values.user_type || user?.user_type || "student",
    gender: values.gender || user?.gender || "unknown",
    student_type:
      values.student_type ||
      (user?.user_type === "student" ? user.student_type ?? "undergraduate" : "undergraduate"),
    role_ids: values.role_ids ?? [],
  }
}

export function toUpdatePayload(
  values: UserFormSubmissionValues,
  options?: SubmissionPlanOptions,
): UpdateUserPayload {
  const includePassword = Boolean(options?.passwordTouched && values.password.trim())
  const basePayload = {
    unified_id: values.unified_id.trim(),
    name: values.name.trim(),
    gender: values.gender,
    birthdate: values.birthdate || null,
    ...(includePassword ? { password: values.password } : {}),
  }

  if (values.user_type === "student") {
    return {
      ...basePayload,
      student_type: values.student_type,
      college: toOptionalText(values.college),
      major: toOptionalText(values.major),
      enrollment_year: toOptionalNumber(values.enrollment_year),
    }
  }

  if (values.user_type === "teacher") {
    return {
      ...basePayload,
      department: toOptionalText(values.department),
      title: toOptionalText(values.title),
    }
  }

  return basePayload
}

export function hasUserRoleBindingsChanged(
  currentRoleIds: number[] | undefined,
  nextRoleIds: number[],
) {
  const initialRoleIds = [...(currentRoleIds ?? [])].sort((left, right) => left - right)
  const normalizedNextRoleIds = [...nextRoleIds].sort((left, right) => left - right)

  return JSON.stringify(initialRoleIds) !== JSON.stringify(normalizedNextRoleIds)
}

export function buildUserFormSubmissionPlan(input: {
  user: User | undefined
  values: UserFormSubmissionValues
  currentRoleIds?: number[]
  passwordTouched?: boolean
}) {
  const normalizedValues = normalizeUserFormValues(input.values, input.user)
  const profilePayload = toUpdatePayload(normalizedValues, {
    passwordTouched: input.passwordTouched,
  })
  const initialProfilePayload = input.user
    ? toUpdatePayload(getFormValuesFromUser(input.user), {
        passwordTouched: input.passwordTouched,
      })
    : null

  const shouldUpdateProfile = input.user
    ? JSON.stringify(initialProfilePayload) !== JSON.stringify(profilePayload)
    : true
  const shouldUpdateRoles = hasUserRoleBindingsChanged(
    input.currentRoleIds,
    normalizedValues.role_ids,
  )

  return {
    shouldUpdateProfile,
    shouldUpdateRoles,
    profilePayload,
    roleIds: normalizedValues.role_ids,
  }
}
