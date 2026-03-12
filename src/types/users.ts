import type { PaginatedResponse } from "@/types/api"

export type UserId = number

export type UserType = "student" | "teacher" | "admin"

export type Gender = "male" | "female" | "unknown"

export type StudentType = "undergraduate" | "master" | "phd"

export interface UserBase {
  id: UserId
  user_type: UserType
  unified_id: string
  name: string
  gender: Gender
  birthdate?: string | null
  is_active: boolean
  roles: string[]
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface StudentUser extends UserBase {
  user_type: "student"
  student_type?: StudentType
  college?: string | null
  major?: string | null
  enrollment_year?: number | null
}

export interface TeacherUser extends UserBase {
  user_type: "teacher"
  department?: string | null
  title?: string | null
}

export interface AdminUser extends UserBase {
  user_type: "admin"
}

export type User = StudentUser | TeacherUser | AdminUser

interface CreateUserBasePayload {
  unified_id: string
  password: string
  name: string
  gender: Gender
  birthdate?: string | null
}

export interface CreateStudentPayload extends CreateUserBasePayload {
  user_type: "student"
  student_type: StudentType
  college?: string | null
  major?: string | null
  enrollment_year?: number | null
  department?: never
  title?: never
}

export interface CreateTeacherPayload extends CreateUserBasePayload {
  user_type: "teacher"
  department?: string | null
  title?: string | null
  student_type?: never
  college?: never
  major?: never
  enrollment_year?: never
}

export interface CreateAdminPayload extends CreateUserBasePayload {
  user_type: "admin"
  student_type?: never
  college?: never
  major?: never
  enrollment_year?: never
  department?: never
  title?: never
}

export type CreateUserPayload =
  | CreateStudentPayload
  | CreateTeacherPayload
  | CreateAdminPayload

interface UpdateUserBasePayload {
  unified_id?: string
  password?: string
  name?: string
  gender?: Gender
  birthdate?: string | null
  is_active?: boolean
}

export interface UpdateStudentPayload extends UpdateUserBasePayload {
  student_type?: StudentType | null
  college?: string | null
  major?: string | null
  enrollment_year?: number | null
  department?: never
  title?: never
}

export interface UpdateTeacherPayload extends UpdateUserBasePayload {
  department?: string | null
  title?: string | null
  student_type?: never
  college?: never
  major?: never
  enrollment_year?: never
}

export interface UpdateAdminPayload extends UpdateUserBasePayload {
  student_type?: never
  college?: never
  major?: never
  enrollment_year?: never
  department?: never
  title?: never
}

export type UpdateUserPayload =
  | UpdateStudentPayload
  | UpdateTeacherPayload
  | UpdateAdminPayload

export interface ListUsersParams {
  page?: number
  page_size?: number
  keyword?: string
  user_type?: UserType
  is_active?: boolean
}

export interface ListUsersResponse extends PaginatedResponse<User> {
  items: User[]
  total: number
  page: number
  page_size: number
}
