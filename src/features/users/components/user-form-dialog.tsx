import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"

import { usersApi } from "@/api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { normalizeApiError } from "@/lib/http"
import { useAuthStore } from "@/stores/auth-store"
import type {
  CreateUserPayload,
  Gender,
  StudentType,
  UpdateUserPayload,
  User,
  UserId,
  UserType,
} from "@/types/users"

interface UserFormDialogProps {
  open: boolean
  mode: "create" | "edit"
  userId: UserId | null
  onOpenChange: (open: boolean) => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

interface UserFormValues {
  user_type: UserType
  unified_id: string
  name: string
  password: string
  gender: Gender
  birthdate: string
  student_type: StudentType
  college: string
  major: string
  enrollment_year: string
  department: string
  title: string
}

const defaultValues: UserFormValues = {
  user_type: "student",
  unified_id: "",
  name: "",
  password: "",
  gender: "unknown",
  birthdate: "",
  student_type: "undergraduate",
  college: "",
  major: "",
  enrollment_year: "",
  department: "",
  title: "",
}

function toOptionalText(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function toOptionalNumber(value: string) {
  const trimmed = value.trim()
  return trimmed ? Number(trimmed) : null
}

function getFormValuesFromUser(user: User): UserFormValues {
  return {
    user_type: user.user_type,
    unified_id: user.unified_id,
    name: user.name,
    password: "",
    gender: user.gender ?? "unknown",
    birthdate: user.birthdate ?? "",
    student_type: user.user_type === "student" ? user.student_type ?? "undergraduate" : "undergraduate",
    college: user.user_type === "student" ? user.college ?? "" : "",
    major: user.user_type === "student" ? user.major ?? "" : "",
    enrollment_year:
      user.user_type === "student" && user.enrollment_year
        ? String(user.enrollment_year)
        : "",
    department: user.user_type === "teacher" ? user.department ?? "" : "",
    title: user.user_type === "teacher" ? user.title ?? "" : "",
  }
}

function toCreatePayload(values: UserFormValues): CreateUserPayload {
  const basePayload = {
    user_type: values.user_type,
    unified_id: values.unified_id.trim(),
    name: values.name.trim(),
    password: values.password,
    gender: values.gender,
    birthdate: values.birthdate || null,
  } as const

  if (values.user_type === "student") {
    return {
      ...basePayload,
      user_type: "student",
      student_type: values.student_type,
      college: toOptionalText(values.college),
      major: toOptionalText(values.major),
      enrollment_year: toOptionalNumber(values.enrollment_year),
    }
  }

  if (values.user_type === "teacher") {
    return {
      ...basePayload,
      user_type: "teacher",
      department: toOptionalText(values.department),
      title: toOptionalText(values.title),
    }
  }

  return {
    ...basePayload,
    user_type: "admin",
  }
}

function toUpdatePayload(values: UserFormValues): UpdateUserPayload {
  const basePayload = {
    unified_id: values.unified_id.trim(),
    name: values.name.trim(),
    gender: values.gender,
    birthdate: values.birthdate || null,
    password: values.password.trim() ? values.password : undefined,
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

export function UserFormDialog({
  open,
  mode,
  userId,
  onOpenChange,
  onSuccess,
  onError,
}: UserFormDialogProps) {
  const queryClient = useQueryClient()
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser)
  const currentUser = useAuthStore((state) => state.currentUser)

  const form = useForm<UserFormValues>({
    mode: "onBlur",
    defaultValues,
  })

  const userQuery = useQuery({
    queryKey: ["users", "detail", userId],
    queryFn: () => usersApi.getUserById(userId!),
    enabled: open && mode === "edit" && userId !== null,
  })

  useEffect(() => {
    if (!open) {
      form.reset(defaultValues)
      return
    }

    if (mode === "create") {
      form.reset(defaultValues)
      return
    }

    if (userQuery.data) {
      form.reset(getFormValuesFromUser(userQuery.data))
    }
  }, [form, mode, open, userQuery.data])

  const userType =
    useWatch({
      control: form.control,
      name: "user_type",
    }) ?? "student"

  const mutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      if (mode === "create") {
        return usersApi.createUser(toCreatePayload(values))
      }

      return usersApi.updateUser(userId!, toUpdatePayload(values))
    },
    onSuccess: async (user) => {
      await queryClient.invalidateQueries({ queryKey: ["users"] })
      await queryClient.invalidateQueries({ queryKey: ["users", "detail", user.id] })
      await queryClient.invalidateQueries({ queryKey: ["auth", "current-user"] })

      if (currentUser?.id === user.id) {
        setCurrentUser(user)
      }

      onSuccess(mode === "create" ? "用户创建成功。" : "用户信息已更新。")
      onOpenChange(false)
    },
    onError: (error) => {
      onError(normalizeApiError(error).message)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "新增用户" : "编辑用户"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "创建新的学生、教师或管理员账号。"
              : "更新现有用户的基础信息与扩展字段。"}
          </DialogDescription>
        </DialogHeader>

        {mode === "edit" && userQuery.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <form
            className="space-y-6"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="user_type">用户类型</Label>
                {mode === "create" ? (
                  <Controller
                    control={form.control}
                    name="user_type"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="选择用户类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">学生</SelectItem>
                          <SelectItem value="teacher">教师</SelectItem>
                          <SelectItem value="admin">管理员</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                ) : (
                  <Input disabled value={userType === "student" ? "学生" : userType === "teacher" ? "教师" : "管理员"} />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unified_id">统一身份账号</Label>
                <Input
                  id="unified_id"
                  aria-invalid={form.formState.errors.unified_id ? true : undefined}
                  {...form.register("unified_id", {
                    required: "请输入统一身份账号",
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">姓名</Label>
                <Input
                  id="name"
                  aria-invalid={form.formState.errors.name ? true : undefined}
                  {...form.register("name", {
                    required: "请输入姓名",
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {mode === "create" ? "初始密码" : "重置密码"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={mode === "create" ? "请输入初始密码" : "留空表示不修改"}
                  aria-invalid={form.formState.errors.password ? true : undefined}
                  {...form.register("password", {
                    validate: (value) => {
                      if (mode === "create" && !value.trim()) {
                        return "请输入初始密码"
                      }

                      return true
                    },
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">性别</Label>
                <Controller
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择性别" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unknown">未知</SelectItem>
                        <SelectItem value="male">男</SelectItem>
                        <SelectItem value="female">女</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthdate">出生日期</Label>
                <Input id="birthdate" type="date" {...form.register("birthdate")} />
              </div>

              {userType === "student" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="student_type">学生类型</Label>
                    <Controller
                      control={form.control}
                      name="student_type"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="选择学生类型" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="undergraduate">本科生</SelectItem>
                            <SelectItem value="master">硕士生</SelectItem>
                            <SelectItem value="phd">博士生</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="enrollment_year">入学年份</Label>
                    <Input id="enrollment_year" type="number" {...form.register("enrollment_year")} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="college">学院</Label>
                    <Input id="college" {...form.register("college")} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="major">专业</Label>
                    <Input id="major" {...form.register("major")} />
                  </div>
                </>
              ) : null}

              {userType === "teacher" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="department">院系</Label>
                    <Input id="department" {...form.register("department")} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">职称</Label>
                    <Input id="title" {...form.register("title")} />
                  </div>
                </>
              ) : null}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button disabled={mutation.isPending} type="submit">
                {mutation.isPending ? "提交中..." : mode === "create" ? "创建用户" : "保存修改"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
