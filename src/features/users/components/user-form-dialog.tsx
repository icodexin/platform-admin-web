import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"

import { rolesApi, usersApi } from "@/api"
import { Badge } from "@/components/ui/badge"
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
import {
  buildUserFormSubmissionPlan,
  getFormValuesFromUser,
} from "@/features/users/lib/user-form-submit-plan"
import { normalizeApiError } from "@/lib/http"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import type { CreateUserPayload, UserId } from "@/types/users"

interface UserFormDialogProps {
  open: boolean
  mode: "create" | "edit"
  userId: UserId | null
  onOpenChange: (open: boolean) => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

type UserFormValues = ReturnType<typeof getFormValuesFromUser>

const defaultValues: UserFormValues = getFormValuesFromUser({
  id: 0,
  user_type: "student",
  unified_id: "",
  name: "",
  gender: "unknown",
  birthdate: "",
  is_active: true,
  roles: [],
  student_type: "undergraduate",
  college: "",
  major: "",
  enrollment_year: null,
})

function toOptionalText(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function toOptionalNumber(value: string) {
  const trimmed = value.trim()
  return trimmed ? Number(trimmed) : null
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

  const userRolesQuery = useQuery({
    queryKey: ["users", "roles", userId],
    queryFn: () => usersApi.getUserRoles(userId!),
    enabled: open && mode === "edit" && userId !== null,
  })

  const rolesQuery = useQuery({
    queryKey: ["roles", "options"],
    queryFn: () => rolesApi.listRoles({ page: 1, page_size: 100 }),
    enabled: open && mode === "edit",
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

    if (userQuery.data && userRolesQuery.data) {
      form.reset({
        ...getFormValuesFromUser(userQuery.data),
        role_ids: userRolesQuery.data.roles
        .filter((role) => role.id !== userRolesQuery.data.immutable_role.id)
        .map((role) => role.id),
      })
    }
  }, [form, mode, open, userQuery.data, userRolesQuery.data])

  const userType =
    useWatch({
      control: form.control,
      name: "user_type",
    }) ?? "student"
  const selectedRoleIds =
    useWatch({
      control: form.control,
      name: "role_ids",
    }) ?? []
  const immutableRole = userRolesQuery.data?.immutable_role ?? null
  const customRoles = (rolesQuery.data?.items ?? []).filter((role) => !role.is_system)

  const toggleRole = (roleId: number) => {
    form.setValue(
      "role_ids",
      selectedRoleIds.includes(roleId)
        ? selectedRoleIds.filter((id) => id !== roleId)
        : [...selectedRoleIds, roleId],
      {
        shouldDirty: true,
        shouldTouch: true,
      },
    )
  }

  const mutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      if (mode === "create") {
        return usersApi.createUser(toCreatePayload(values))
      }

      let user = userQuery.data
      const currentRoleIds = userRolesQuery.data?.roles
        .filter((role) => role.id !== userRolesQuery.data?.immutable_role.id)
        .map((role) => role.id)
      const plan = buildUserFormSubmissionPlan({
        user,
        values,
        currentRoleIds,
        passwordTouched: Boolean(form.formState.touchedFields.password),
      })

      if (plan.shouldUpdateProfile) {
        user = await usersApi.updateUser(userId!, plan.profilePayload)
      }

      if (plan.shouldUpdateRoles) {
        await usersApi.updateUserRoles(userId!, {
          role_ids: plan.roleIds,
        })
      }

      if (!user) {
        user = await usersApi.getUserById(userId!)
      }

      return user
    },
    onSuccess: async (user) => {
      await queryClient.invalidateQueries({ queryKey: ["users"] })
      await queryClient.invalidateQueries({ queryKey: ["users", "detail", user.id] })
      await queryClient.invalidateQueries({ queryKey: ["users", "roles", user.id] })
      await queryClient.invalidateQueries({ queryKey: ["roles"] })
      await queryClient.invalidateQueries({ queryKey: ["auth", "current-user"] })

      if (currentUser?.id === user.id) {
        const nextCurrentUser = await usersApi.getCurrentUser()
        setCurrentUser(nextCurrentUser)
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
            autoComplete="off"
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
                  autoComplete="off"
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
                  autoComplete="new-password"
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

            {mode === "edit" ? (
              <div className="rounded-2xl border bg-muted/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">角色绑定</div>
                    <p className="text-sm text-muted-foreground">
                      用户类型对应的系统内置角色会自动保留，只能调整附加的自定义角色。
                    </p>
                  </div>
                  <Badge variant="secondary">附加角色 {selectedRoleIds.length} 项</Badge>
                </div>

                <div className="mt-4 space-y-4">
                  {userRolesQuery.isPending || rolesQuery.isPending ? (
                    <div className="grid gap-3">
                      <Skeleton className="h-16 rounded-2xl" />
                      <Skeleton className="h-28 rounded-2xl" />
                    </div>
                  ) : null}

                  {immutableRole ? (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">系统内置角色</div>
                      <div className="rounded-2xl border bg-background px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{immutableRole.name}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {immutableRole.code}
                          </span>
                          <span className="text-xs text-muted-foreground">不可变更</span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {!rolesQuery.isPending ? (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">附加自定义角色</div>
                      {customRoles.length > 0 ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {customRoles.map((role) => {
                            const isSelected = selectedRoleIds.includes(role.id)

                            return (
                              <button
                                key={role.id}
                                type="button"
                                className={cn(
                                  "flex min-h-16 flex-col items-start justify-center rounded-xl border px-4 py-3 text-left transition-colors",
                                  isSelected
                                    ? "border-primary bg-primary/8 text-foreground"
                                    : "border-border bg-background hover:bg-accent/40",
                                )}
                                onClick={() => toggleRole(role.id)}
                              >
                                <span className="text-sm font-medium">{role.name}</span>
                                <span className="mt-1 text-xs text-muted-foreground">
                                  {role.code}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
                          当前没有可分配的自定义角色。
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button
                disabled={
                  mutation.isPending ||
                  (mode === "edit" && (userRolesQuery.isPending || rolesQuery.isPending))
                }
                type="submit"
              >
                {mutation.isPending ? "提交中..." : mode === "create" ? "创建用户" : "保存修改"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
