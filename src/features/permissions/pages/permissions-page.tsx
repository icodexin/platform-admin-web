import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Edit3, KeyRound, Plus, RefreshCcw, Search, Trash2 } from "lucide-react"
import { startTransition, useMemo, useState } from "react"

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
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PermissionFormDialog } from "@/features/permissions/components/permission-form-dialog"
import { normalizeApiError } from "@/lib/http"
import type { ListPermissionsParams, Permission, PermissionId } from "@/types/permissions"

const PAGE_SIZE = 10

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export function PermissionsPage() {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState("")
  const [keywordInput, setKeywordInput] = useState("")
  const [page, setPage] = useState(1)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editPermissionId, setEditPermissionId] = useState<PermissionId | null>(null)
  const [deletePermission, setDeletePermission] = useState<Permission | null>(null)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  const queryParams = useMemo<ListPermissionsParams>(() => {
    return {
      page,
      page_size: PAGE_SIZE,
      keyword: keyword.trim() || undefined,
    }
  }, [keyword, page])

  const permissionsQuery = useQuery({
    queryKey: ["permissions", queryParams],
    queryFn: () => permissionsApi.listPermissions(queryParams),
    placeholderData: (previous) => previous,
  })

  const deleteMutation = useMutation({
    mutationFn: (permissionId: PermissionId) =>
      permissionsApi.deletePermission(permissionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["permissions"] })
      setFeedback({
        type: "success",
        message: "权限已删除。",
      })
      setDeletePermission(null)
    },
    onError: (error) => {
      setFeedback({
        type: "error",
        message: normalizeApiError(error).message,
      })
    },
  })

  const items = permissionsQuery.data?.items ?? []
  const total = permissionsQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const systemPermissionCount = items.filter((item) => item.is_system).length
  const customPermissionCount = items.filter((item) => !item.is_system).length

  const submitSearch = () => {
    startTransition(() => {
      setKeyword(keywordInput)
      setPage(1)
    })
  }

  const resetFilters = () => {
    startTransition(() => {
      setKeyword("")
      setKeywordInput("")
      setPage(1)
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>权限总数</CardDescription>
            <CardTitle className="text-3xl">{total}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            基于当前筛选条件返回的权限记录数。
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>内置权限</CardDescription>
            <CardTitle className="text-3xl">{systemPermissionCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            系统内置权限通常用于平台核心能力控制。
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>自定义权限</CardDescription>
            <CardTitle className="text-3xl">{customPermissionCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            可由管理员根据业务需要新增和维护。
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
            <CardTitle>权限列表</CardTitle>
            <CardDescription>查看、创建、编辑和删除权限项。</CardDescription>
          </div>

          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            新增权限
          </Button>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <form
              className="relative"
              onSubmit={(event) => {
                event.preventDefault()
                submitSearch()
              }}
            >
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9 pr-24"
                placeholder="搜索权限编码或名称"
                value={keywordInput}
                onBlur={() => setIsSearchFocused(false)}
                onChange={(event) => setKeywordInput(event.target.value)}
                onFocus={() => setIsSearchFocused(true)}
              />
              {isSearchFocused || keywordInput.trim() ? (
                <Button
                  type="submit"
                  size="sm"
                  className="absolute top-1/2 right-1 h-7 -translate-y-1/2 rounded-md px-3"
                  onMouseDown={(event) => event.preventDefault()}
                >
                  搜索
                </Button>
              ) : null}
            </form>

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => permissionsQuery.refetch()}
            >
              <RefreshCcw className="size-4" />
              刷新
            </Button>

            <Button variant="ghost" onClick={resetFilters}>
              重置筛选
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">权限</TableHead>
                  <TableHead>关联角色数</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead className="w-[80px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissionsQuery.isPending
                  ? Array.from({ length: 6 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell className="px-4">
                          <Skeleton className="h-14 w-full rounded-xl" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20 rounded-full" />
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

                {!permissionsQuery.isPending && items.length === 0 ? (
                  <TableRow>
                    <TableCell className="px-4 py-10 text-center text-muted-foreground" colSpan={5}>
                      当前筛选条件下没有找到权限项。
                    </TableCell>
                  </TableRow>
                ) : null}

                {!permissionsQuery.isPending
                  ? items.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell className="px-4">
                          <div className="space-y-1">
                            <div className="font-medium">{permission.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {permission.code}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{permission.role_count}</TableCell>
                        <TableCell>
                          <Badge variant={permission.is_system ? "secondary" : "outline"}>
                            {permission.is_system ? "系统内置" : "自定义"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(permission.updated_at)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <KeyRound className="size-4" />
                                <span className="sr-only">打开权限操作菜单</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                disabled={permission.is_system}
                                onClick={() => setEditPermissionId(permission.id)}
                              >
                                <Edit3 />
                                {permission.is_system ? "系统权限不可编辑" : "编辑权限"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                disabled={permission.is_system}
                                onClick={() => setDeletePermission(permission)}
                              >
                                <Trash2 />
                                {permission.is_system ? "系统权限不可删除" : "删除权限"}
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

          <div className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>
              当前第 {page} / {totalPages} 页，共 {total} 条记录。
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <PermissionFormDialog
        open={createOpen}
        mode="create"
        permissionId={null}
        onOpenChange={setCreateOpen}
        onSuccess={(message) => setFeedback({ type: "success", message })}
        onError={(message) => setFeedback({ type: "error", message })}
      />

      <PermissionFormDialog
        open={editPermissionId !== null}
        mode="edit"
        permissionId={editPermissionId}
        onOpenChange={(open) => {
          if (!open) {
            setEditPermissionId(null)
          }
        }}
        onSuccess={(message) => setFeedback({ type: "success", message })}
        onError={(message) => setFeedback({ type: "error", message })}
      />

      <AlertDialog
        open={deletePermission !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletePermission(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除该权限？</AlertDialogTitle>
            <AlertDialogDescription>
              {deletePermission
                ? `删除后，权限 ${deletePermission.name}（${deletePermission.code}）将无法继续被角色引用。`
                : "删除后权限将不可恢复。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deletePermission) {
                  deleteMutation.mutate(deletePermission.id)
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
