import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

import { permissionsApi } from "@/api"
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
import type { CreatePermissionPayload, Permission, PermissionId, UpdatePermissionPayload } from "@/types/permissions"

interface PermissionFormDialogProps {
  open: boolean
  mode: "create" | "edit"
  permissionId: PermissionId | null
  onOpenChange: (open: boolean) => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

interface PermissionFormValues {
  code: string
  name: string
}

const defaultValues: PermissionFormValues = {
  code: "",
  name: "",
}

function getFormValues(permission: Permission): PermissionFormValues {
  return {
    code: permission.code,
    name: permission.name,
  }
}

function toCreatePayload(values: PermissionFormValues): CreatePermissionPayload {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
  }
}

function toUpdatePayload(values: PermissionFormValues): UpdatePermissionPayload {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
  }
}

export function PermissionFormDialog({
  open,
  mode,
  permissionId,
  onOpenChange,
  onSuccess,
  onError,
}: PermissionFormDialogProps) {
  const queryClient = useQueryClient()
  const form = useForm<PermissionFormValues>({
    mode: "onBlur",
    defaultValues,
  })

  const permissionQuery = useQuery({
    queryKey: ["permissions", "detail", permissionId],
    queryFn: () => permissionsApi.getPermissionById(permissionId!),
    enabled: open && mode === "edit" && permissionId !== null,
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

    if (permissionQuery.data) {
      form.reset(getFormValues(permissionQuery.data))
    }
  }, [form, mode, open, permissionQuery.data])

  const mutation = useMutation({
    mutationFn: async (values: PermissionFormValues) => {
      if (mode === "create") {
        return permissionsApi.createPermission(toCreatePayload(values))
      }

      return permissionsApi.updatePermission(permissionId!, toUpdatePayload(values))
    },
    onSuccess: async (permission) => {
      await queryClient.invalidateQueries({ queryKey: ["permissions"] })
      await queryClient.invalidateQueries({
        queryKey: ["permissions", "detail", permission.id],
      })

      onSuccess(mode === "create" ? "权限创建成功。" : "权限信息已更新。")
      onOpenChange(false)
    },
    onError: (error) => {
      onError(normalizeApiError(error).message)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "新增权限" : "编辑权限"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "新增一个可分配给角色的权限项。"
              : "更新权限编码或显示名称。"}
          </DialogDescription>
        </DialogHeader>

        {mode === "edit" && permissionQuery.isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="space-y-2">
              <Label htmlFor="code">权限编码</Label>
              <Input
                id="code"
                placeholder="例如 sys.user.read.all"
                aria-invalid={form.formState.errors.code ? true : undefined}
                {...form.register("code", {
                  required: "请输入权限编码",
                  minLength: {
                    value: 3,
                    message: "权限编码至少 3 个字符",
                  },
                  pattern: {
                    value: /^[a-z][a-z0-9._:-]*$/,
                    message: "权限编码需以小写字母开头，只能包含小写字母、数字、点、下划线、冒号和中划线",
                  },
                })}
              />
              {form.formState.errors.code ? (
                <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">权限名称</Label>
              <Input
                id="name"
                placeholder="请输入权限名称"
                aria-invalid={form.formState.errors.name ? true : undefined}
                {...form.register("name", {
                  required: "请输入权限名称",
                })}
              />
              {form.formState.errors.name ? (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button disabled={mutation.isPending} type="submit">
                {mutation.isPending ? "提交中..." : mode === "create" ? "创建权限" : "保存修改"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
