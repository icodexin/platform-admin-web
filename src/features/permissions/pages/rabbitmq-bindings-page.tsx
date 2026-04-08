import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Edit3,
  ExternalLink,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  Waypoints,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"

import { permissionsApi } from "@/api"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RabbitMQBindingFormDialog } from "@/features/permissions/components/rabbitmq-binding-form-dialog"
import {
  rabbitMQCheckTypeLabels,
  rabbitMQPermissionLevelLabels,
  rabbitMQResourceTypeLabels,
  rabbitMQTagLabels,
} from "@/features/permissions/lib/rabbitmq-binding-form"
import { normalizeApiError } from "@/lib/http"
import type {
  Permission,
  RabbitMQBindingCheckType,
  RabbitMQPermissionBinding,
  RabbitMQPermissionBindingId,
} from "@/types/permissions"

const PERMISSION_OPTIONS_PAGE_SIZE = 100

function formatDateTime(value?: string | null) {
  if (!value) {
    return "--"
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function getBindingBadgeVariant(checkType: RabbitMQBindingCheckType) {
  if (checkType === "user") {
    return "secondary" as const
  }

  if (checkType === "topic") {
    return "default" as const
  }

  return "outline" as const
}

function renderBindingSummary(binding: RabbitMQPermissionBinding) {
  if (binding.check_type === "user") {
    return [
      {
        label: "Tag",
        value: binding.rabbitmq_tag ? rabbitMQTagLabels[binding.rabbitmq_tag] : "--",
      },
    ]
  }

  if (binding.check_type === "vhost") {
    return [
      {
        label: "Vhost",
        value: binding.vhost_pattern || "*",
      },
    ]
  }

  if (binding.check_type === "topic") {
    return [
      {
        label: "Vhost",
        value: binding.vhost_pattern || "*",
      },
      {
        label: "资源",
        value: binding.resource_name_pattern || "--",
      },
      {
        label: "级别",
        value: binding.permission_level
          ? rabbitMQPermissionLevelLabels[binding.permission_level]
          : "--",
      },
      {
        label: "Routing Key",
        value: binding.routing_key_pattern || "--",
      },
    ]
  }

  return [
    {
      label: "Vhost",
      value: binding.vhost_pattern || "*",
    },
    {
      label: "资源类型",
      value: binding.resource_type
        ? rabbitMQResourceTypeLabels[binding.resource_type]
        : "--",
    },
    {
      label: "资源",
      value: binding.resource_name_pattern || "--",
    },
    {
      label: "级别",
      value: binding.permission_level
        ? rabbitMQPermissionLevelLabels[binding.permission_level]
        : "--",
    },
  ]
}

export function RabbitMQBindingsPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [checkTypeFilter, setCheckTypeFilter] = useState<"all" | RabbitMQBindingCheckType>("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [editBindingId, setEditBindingId] = useState<RabbitMQPermissionBindingId | null>(null)
  const [deleteBinding, setDeleteBinding] = useState<RabbitMQPermissionBinding | null>(null)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  const permissionIdFromQuery = searchParams.get("permissionId")
  const selectedPermissionId =
    permissionIdFromQuery && Number.isFinite(Number(permissionIdFromQuery))
      ? Number(permissionIdFromQuery)
      : null

  const setSelectedPermissionId = useCallback(
    (permissionId: number | null) => {
      const nextParams = new URLSearchParams(searchParams)

      if (permissionId === null) {
        nextParams.delete("permissionId")
      } else {
        nextParams.set("permissionId", String(permissionId))
      }

      setSearchParams(nextParams, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const permissionsQuery = useQuery({
    queryKey: ["permissions", "rabbitmq-binding-options"],
    queryFn: () =>
      permissionsApi.listPermissions({
        page: 1,
        page_size: PERMISSION_OPTIONS_PAGE_SIZE,
      }),
  })

  const selectedPermissionQuery = useQuery({
    queryKey: ["permissions", "detail", selectedPermissionId],
    queryFn: () => permissionsApi.getPermissionById(selectedPermissionId!),
    enabled: selectedPermissionId !== null,
  })

  useEffect(() => {
    if (selectedPermissionId === null && (permissionsQuery.data?.items?.length ?? 0) > 0) {
      setSelectedPermissionId(permissionsQuery.data!.items[0].id)
    }
  }, [permissionsQuery.data, selectedPermissionId, setSelectedPermissionId])

  const permissionOptions = useMemo(() => {
    const options = permissionsQuery.data?.items ?? []

    if (
      selectedPermissionQuery.data &&
      !options.some((permission) => permission.id === selectedPermissionQuery.data?.id)
    ) {
      return [selectedPermissionQuery.data, ...options]
    }

    return options
  }, [permissionsQuery.data?.items, selectedPermissionQuery.data])

  const selectedPermission =
    selectedPermissionQuery.data ??
    permissionOptions.find((permission) => permission.id === selectedPermissionId) ??
    null

  const bindingsQuery = useQuery({
    queryKey: ["permissions", "rabbitmq-bindings", selectedPermissionId],
    queryFn: () => permissionsApi.listRabbitMQPermissionBindings(selectedPermissionId!),
    enabled: selectedPermissionId !== null,
  })

  const deleteMutation = useMutation({
    mutationFn: (bindingId: RabbitMQPermissionBindingId) =>
      permissionsApi.deleteRabbitMQPermissionBinding(selectedPermissionId!, bindingId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["permissions", "rabbitmq-bindings", selectedPermissionId],
      })
      setFeedback({
        type: "success",
        message: "RabbitMQ 权限绑定已删除。",
      })
      setDeleteBinding(null)
    },
    onError: (error) => {
      setFeedback({
        type: "error",
        message: normalizeApiError(error).message,
      })
    },
  })

  const bindings = bindingsQuery.data?.items ?? []
  const totalBindings = bindingsQuery.data?.total ?? bindings.length
  const filteredBindings =
    checkTypeFilter === "all"
      ? bindings
      : bindings.filter((binding) => binding.check_type === checkTypeFilter)
  const userBindingCount = bindings.filter((binding) => binding.check_type === "user").length
  const vhostBindingCount = bindings.filter((binding) => binding.check_type === "vhost").length
  const resourceBindingCount = bindings.filter((binding) => binding.check_type === "resource").length
  const topicBindingCount = bindings.filter((binding) => binding.check_type === "topic").length
  const coveredCheckTypes = new Set(bindings.map((binding) => binding.check_type)).size

  const handleRefresh = async () => {
    await permissionsQuery.refetch()

    if (selectedPermissionId !== null) {
      await Promise.all([selectedPermissionQuery.refetch(), bindingsQuery.refetch()])
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        <Card className="xl:col-span-2">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>当前权限项</CardDescription>
            <CardTitle className="text-2xl">
              {selectedPermission?.name ?? "请选择权限项"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {selectedPermission ? (
              <>
                <Badge variant={selectedPermission.is_system ? "secondary" : "outline"}>
                  {selectedPermission.is_system ? "系统内置" : "自定义"}
                </Badge>
                <span>{selectedPermission.code}</span>
                <span>关联角色 {selectedPermission.role_count} 项</span>
              </>
            ) : (
              <span>先从下方选择一个权限，再查看或维护其 RabbitMQ 绑定。</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>绑定总数</CardDescription>
            <CardTitle className="text-3xl">{totalBindings}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            当前权限下的 RabbitMQ 绑定规则总量。
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>覆盖校验面</CardDescription>
            <CardTitle className="text-3xl">{coveredCheckTypes}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            已覆盖的 `check_type` 种类数。
          </CardContent>
        </Card>
      </div>

      {feedback ? (
        <div
          className={
            feedback.type === "success"
              ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
              : "rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
          }
        >
          {feedback.message}
        </div>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle>绑定规则列表</CardTitle>
            <CardDescription>
              按权限维护 RabbitMQ 标签、vhost、resource 与 topic 规则。
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" className="gap-2">
              <a href="/mq/admin" target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                打开 RabbitMQ 管理页
              </a>
            </Button>

            <Button
              className="gap-2"
              disabled={selectedPermissionId === null}
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" />
              新增绑定
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]">
            <div className="space-y-2">
              <Label htmlFor="permission_id">权限项</Label>
              {permissionsQuery.isError ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/8 px-3 py-2 text-sm text-destructive">
                  权限项加载失败：{normalizeApiError(permissionsQuery.error).message}
                </div>
              ) : (
                <Select
                  value={selectedPermissionId ? String(selectedPermissionId) : undefined}
                  onValueChange={(value) => {
                    setCreateOpen(false)
                    setEditBindingId(null)
                    setDeleteBinding(null)
                    setSelectedPermissionId(Number(value))
                  }}
                >
                  <SelectTrigger id="permission_id" className="w-full">
                    <SelectValue
                      placeholder={
                        permissionsQuery.isPending ? "权限项加载中..." : "选择权限项"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {permissionOptions.map((permission: Permission) => (
                      <SelectItem key={permission.id} value={String(permission.id)}>
                        {permission.name} · {permission.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="check_type_filter">规则类型</Label>
              <Select
                value={checkTypeFilter}
                onValueChange={(value) =>
                  setCheckTypeFilter(value as "all" | RabbitMQBindingCheckType)
                }
              >
                <SelectTrigger id="check_type_filter" className="w-full">
                  <SelectValue placeholder="筛选规则类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="user">用户标签</SelectItem>
                  <SelectItem value="vhost">Vhost 访问</SelectItem>
                  <SelectItem value="resource">资源访问</SelectItem>
                  <SelectItem value="topic">Topic 路由</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" className="mt-auto gap-2" onClick={handleRefresh}>
              <RefreshCcw className="size-4" />
              刷新
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border bg-muted/20 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                User
              </div>
              <div className="mt-2 text-2xl font-semibold">{userBindingCount}</div>
            </div>
            <div className="rounded-2xl border bg-muted/20 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Vhost
              </div>
              <div className="mt-2 text-2xl font-semibold">{vhostBindingCount}</div>
            </div>
            <div className="rounded-2xl border bg-muted/20 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Resource
              </div>
              <div className="mt-2 text-2xl font-semibold">{resourceBindingCount}</div>
            </div>
            <div className="rounded-2xl border bg-muted/20 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Topic
              </div>
              <div className="mt-2 text-2xl font-semibold">{topicBindingCount}</div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">类型</TableHead>
                  <TableHead>规则详情</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead className="w-[80px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedPermissionId === null ? (
                  <TableRow>
                    <TableCell className="px-4 py-10 text-center text-muted-foreground" colSpan={4}>
                      当前没有可用权限项，无法维护 RabbitMQ 绑定。
                    </TableCell>
                  </TableRow>
                ) : null}

                {selectedPermissionId !== null && bindingsQuery.isPending
                  ? Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell className="px-4">
                          <Skeleton className="h-10 w-28 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-14 w-full rounded-2xl" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-28 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="ml-auto h-8 w-8 rounded-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  : null}

                {selectedPermissionId !== null && bindingsQuery.isError ? (
                  <TableRow>
                    <TableCell className="px-4 py-10 text-center text-destructive" colSpan={4}>
                      {normalizeApiError(bindingsQuery.error).message}
                    </TableCell>
                  </TableRow>
                ) : null}

                {selectedPermissionId !== null &&
                !bindingsQuery.isPending &&
                !bindingsQuery.isError &&
                filteredBindings.length === 0 ? (
                  <TableRow>
                    <TableCell className="px-4 py-10 text-center text-muted-foreground" colSpan={4}>
                      当前筛选条件下没有 RabbitMQ 绑定规则。
                    </TableCell>
                  </TableRow>
                ) : null}

                {selectedPermissionId !== null &&
                !bindingsQuery.isPending &&
                !bindingsQuery.isError
                  ? filteredBindings.map((binding) => (
                      <TableRow key={binding.id}>
                        <TableCell className="px-4">
                          <Badge variant={getBindingBadgeVariant(binding.check_type)}>
                            {rabbitMQCheckTypeLabels[binding.check_type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {renderBindingSummary(binding).map((item) => (
                                <Badge key={`${binding.id}-${item.label}`} variant="outline">
                                  {item.label}: {item.value}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDateTime(binding.updated_at)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <Waypoints className="size-4" />
                                <span className="sr-only">打开绑定操作菜单</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditBindingId(binding.id)}>
                                <Edit3 />
                                编辑绑定
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleteBinding(binding)}
                              >
                                <Trash2 />
                                删除绑定
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  : null}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-2xl border border-dashed bg-muted/15 px-4 py-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <ShieldCheck className="size-4" />
              配置提示
            </div>
            <div className="mt-2 grid gap-2 lg:grid-cols-2">
              <div>`user` 规则用于设置用户的 `rabbitmq_tag`，仅当其需要后台管理能力添加。</div>
              <div>`vhost` 规则只校验 `vhost_pattern`，用于限制其可以访问的虚拟主机vhost。</div>
              <div>`resource` 规则按 queue/exchange 设置其 configure/write/read权限。</div>
              <div>`topic` 规则额外约束 routing key，适合事件订阅与发布场景。</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <RabbitMQBindingFormDialog
        open={createOpen}
        mode="create"
        permissionId={selectedPermissionId}
        permissionName={selectedPermission?.name}
        bindingId={null}
        onOpenChange={setCreateOpen}
        onSuccess={(message) => setFeedback({ type: "success", message })}
        onError={(message) => setFeedback({ type: "error", message })}
      />

      <RabbitMQBindingFormDialog
        open={editBindingId !== null}
        mode="edit"
        permissionId={selectedPermissionId}
        permissionName={selectedPermission?.name}
        bindingId={editBindingId}
        onOpenChange={(open) => {
          if (!open) {
            setEditBindingId(null)
          }
        }}
        onSuccess={(message) => setFeedback({ type: "success", message })}
        onError={(message) => setFeedback({ type: "error", message })}
      />

      <AlertDialog
        open={deleteBinding !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteBinding(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除该绑定？</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteBinding
                ? `删除后，该权限的 ${rabbitMQCheckTypeLabels[deleteBinding.check_type]} 规则将立即失效。`
                : "删除后当前绑定将不可恢复。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteBinding) {
                  deleteMutation.mutate(deleteBinding.id)
                }
              }}
            >
              {deleteMutation.isPending ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
