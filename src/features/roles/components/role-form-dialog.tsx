import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"

import { permissionsApi, rolesApi } from "@/api"
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
import { Skeleton } from "@/components/ui/skeleton"
import { normalizeApiError } from "@/lib/http"
import { cn } from "@/lib/utils"
import type {
  CreateRolePayload,
  Role,
  RoleId,
  UpdateRolePayload,
  UpdateRolePermissionsPayload,
} from "@/types/roles"

interface RoleFormDialogProps {
  open: boolean
  mode: "create" | "edit"
  roleId: RoleId | null
  onOpenChange: (open: boolean) => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

interface RoleFormValues {
  code: string
  name: string
  permission_ids: number[]
}

const defaultValues: RoleFormValues = {
  code: "",
  name: "",
  permission_ids: [],
}

function getFormValues(role: Role): RoleFormValues {
  return {
    code: role.code,
    name: role.name,
    permission_ids: role.permissions.map((permission) => permission.id),
  }
}

function toCreatePayload(values: RoleFormValues): CreateRolePayload {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    permission_ids: values.permission_ids,
  }
}

function toUpdatePayload(values: RoleFormValues): UpdateRolePayload {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    permission_ids: values.permission_ids,
  }
}

function toUpdatePermissionsPayload(values: RoleFormValues): UpdateRolePermissionsPayload {
  return {
    permission_ids: values.permission_ids,
  }
}

export function RoleFormDialog({
  open,
  mode,
  roleId,
  onOpenChange,
  onSuccess,
  onError,
}: RoleFormDialogProps) {
  const queryClient = useQueryClient()
  const form = useForm<RoleFormValues>({
    mode: "onBlur",
    defaultValues,
  })

  const roleQuery = useQuery({
    queryKey: ["roles", "detail", roleId],
    queryFn: () => rolesApi.getRoleById(roleId!),
    enabled: open && mode === "edit" && roleId !== null,
  })

  const rolePermissionsQuery = useQuery({
    queryKey: ["roles", "permissions", roleId],
    queryFn: () => rolesApi.getRolePermissions(roleId!),
    enabled: open && mode === "edit" && roleId !== null,
  })

  const permissionsQuery = useQuery({
    queryKey: ["permissions", "options"],
    queryFn: () => permissionsApi.listPermissions({ page: 1, page_size: 100 }),
    enabled: open,
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

    const roleData = rolePermissionsQuery.data ?? roleQuery.data

    if (roleData) {
      form.reset(getFormValues(roleData))
    }
  }, [form, mode, open, rolePermissionsQuery.data, roleQuery.data])

  const roleData = rolePermissionsQuery.data ?? roleQuery.data
  const isSystemRole = roleData?.is_system ?? false

  const mutation = useMutation({
    mutationFn: async (values: RoleFormValues) => {
      if (mode === "create") {
        return rolesApi.createRole(toCreatePayload(values))
      }

      if (isSystemRole) {
        return rolesApi.updateRolePermissions(
          roleId!,
          toUpdatePermissionsPayload(values),
        )
      }

      return rolesApi.updateRole(roleId!, toUpdatePayload(values))
    },
    onSuccess: async (role) => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] })
      await queryClient.invalidateQueries({ queryKey: ["permissions"] })
      await queryClient.invalidateQueries({
        queryKey: ["roles", "detail", role.id],
      })
      await queryClient.invalidateQueries({
        queryKey: ["roles", "permissions", role.id],
      })

      onSuccess(
        mode === "create"
          ? "角色创建成功。"
          : isSystemRole
            ? "角色权限绑定已更新。"
            : "角色信息已更新。",
      )
      onOpenChange(false)
    },
    onError: (error) => {
      onError(normalizeApiError(error).message)
    },
  })

  const permissionOptions = permissionsQuery.data?.items ?? []
  const selectedPermissionIds =
    useWatch({
      control: form.control,
      name: "permission_ids",
    }) ?? []

  const togglePermission = (permissionId: number) => {
    const currentValue = form.getValues("permission_ids")
    const nextValue = currentValue.includes(permissionId)
      ? currentValue.filter((id) => id !== permissionId)
      : [...currentValue, permissionId]

    form.setValue("permission_ids", nextValue, {
      shouldDirty: true,
      shouldTouch: true,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "新增角色" : "编辑角色"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "创建角色并配置该角色默认可用的权限集合。"
              : isSystemRole
                ? "当前内置角色仅支持调整权限绑定，角色编码与名称不可修改。"
                : "更新角色编码、名称以及权限绑定。"}
          </DialogDescription>
        </DialogHeader>

        {mode === "edit" && (roleQuery.isPending || rolePermissionsQuery.isPending) ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role-code">角色编码</Label>
                <Input
                  id="role-code"
                  placeholder="例如 biz.ops.viewer"
                  disabled={isSystemRole}
                  aria-invalid={form.formState.errors.code ? true : undefined}
                  {...form.register("code", {
                    required: "请输入角色编码",
                    minLength: {
                      value: 3,
                      message: "角色编码至少 3 个字符",
                    },
                    pattern: {
                      value: /^[a-z][a-z0-9._:-]*$/,
                      message:
                        "角色编码需以小写字母开头，只能包含小写字母、数字、点、下划线、冒号和中划线",
                    },
                  })}
                />
                {form.formState.errors.code ? (
                  <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role-name">角色名称</Label>
                <Input
                  id="role-name"
                  placeholder="请输入角色名称"
                  disabled={isSystemRole}
                  aria-invalid={form.formState.errors.name ? true : undefined}
                  {...form.register("name", {
                    required: "请输入角色名称",
                  })}
                />
                {form.formState.errors.name ? (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">角色权限</Label>
                  <p className="text-sm text-muted-foreground">
                    选中的权限会在提交时整体覆盖当前角色授权。
                  </p>
                </div>
                <Badge variant="secondary">已选 {selectedPermissionIds.length} 项</Badge>
              </div>

              <div className="mt-4">
                {permissionsQuery.isPending ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton key={index} className="h-14 rounded-xl" />
                    ))}
                  </div>
                ) : permissionsQuery.isError ? (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                    权限列表加载失败，暂时无法编辑角色授权。
                  </div>
                ) : permissionOptions.length === 0 ? (
                  <div className="rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
                    当前没有可分配的权限项。
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {permissionOptions.map((permission) => {
                      const isSelected = selectedPermissionIds.includes(permission.id)

                      return (
                        <button
                          key={permission.id}
                          type="button"
                          className={cn(
                            "flex min-h-14 flex-col items-start justify-center rounded-xl border px-4 py-3 text-left transition-colors",
                            isSelected
                              ? "border-primary bg-primary/8 text-foreground"
                              : "border-border bg-background hover:bg-accent/40",
                          )}
                          onClick={() => togglePermission(permission.id)}
                        >
                          <span className="text-sm font-medium">{permission.name}</span>
                          <span className="mt-1 text-xs text-muted-foreground">
                            {permission.code}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button
                disabled={mutation.isPending || permissionsQuery.isPending}
                type="submit"
              >
                {mutation.isPending ? "提交中..." : mode === "create" ? "创建角色" : "保存修改"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
