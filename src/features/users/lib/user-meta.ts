import type { Gender, StudentType, User, UserType } from "@/types/users"

export const userTypeLabelMap: Record<UserType, string> = {
  admin: "管理员",
  teacher: "教师",
  student: "学生",
}

export const genderLabelMap: Record<Gender, string> = {
  male: "男",
  female: "女",
  unknown: "未知",
}

export const studentTypeLabelMap: Record<StudentType, string> = {
  undergraduate: "本科生",
  master: "硕士生",
  phd: "博士生",
}

export function formatUserType(userType: UserType) {
  return userTypeLabelMap[userType]
}

export function formatGender(gender: Gender | null | undefined) {
  if (!gender) {
    return "未填写"
  }

  return genderLabelMap[gender]
}

export function formatStudentType(studentType: StudentType | null | undefined) {
  if (!studentType) {
    return "未填写"
  }

  return studentTypeLabelMap[studentType]
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "未填写"
  }

  return new Intl.DateTimeFormat("zh-CN").format(new Date(value))
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "未填写"
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export function getUserTypeDescription(user: User) {
  if (user.user_type === "student") {
    return `${formatStudentType(user.student_type)} / ${user.major || "未填写专业"}`
  }

  if (user.user_type === "teacher") {
    return `${user.department || "未填写院系"} / ${user.title || "未填写职称"}`
  }

  return "管理员账号"
}
