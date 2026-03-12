import { useQuery } from "@tanstack/react-query"

import { rolesApi } from "@/api"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import type { RoleId } from "@/types/roles"

interface RoleDetailsDialogProps {
  open: boolean
  roleId: RoleId | null
  onOpenChange: (open: boolean) => void
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-2xl border bg-muted/25 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export function RoleDetailsDialog({
  open,
  roleId,
  onOpenChange,
}: RoleDetailsDialogProps) {
  const roleQuery = useQuery({
    queryKey: ["roles", "detail", roleId],
    queryFn: () => rolesApi.getRoleById(roleId!),
    enabled: open && roleId !== null,
  })

  const role = roleQuery.data

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>角色详情</DialogTitle>
          <DialogDescription>查看角色基础信息、授权范围与使用情况。</DialogDescription>
        </DialogHeader>

        {roleQuery.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-2xl" />
            ))}
            <Skeleton className="h-48 w-full rounded-2xl sm:col-span-2" />
          </div>
        ) : null}

        {role ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={role.is_system ? "secondary" : "outline"}>
                {role.is_system ? "系统内置" : "自定义"}
              </Badge>
              <Badge variant="outline">{role.permission_count} 项权限</Badge>
              <Badge variant="outline">{role.user_count} 位绑定用户</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="角色 ID" value={String(role.id)} />
              <Field label="角色编码" value={role.code} />
              <Field label="角色名称" value={role.name} />
              <Field label="绑定用户数" value={String(role.user_count)} />
              <Field label="创建时间" value={formatDateTime(role.created_at)} />
              <Field label="更新时间" value={formatDateTime(role.updated_at)} />
            </div>

            <div className="space-y-3 rounded-2xl border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">完整权限列表</div>
                  <div className="text-sm text-muted-foreground">
                    当前角色拥有的全部权限项。
                  </div>
                </div>
                <Badge variant="secondary">{role.permission_count} 项</Badge>
              </div>

              {role.permissions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map((permission) => (
                    <Badge key={permission.id} variant="outline" className="px-3 py-1">
                      {permission.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
                  当前角色尚未绑定任何权限。
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
