import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Eye,
  Edit3,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  UsersRound,
} from "lucide-react"
import { startTransition, useMemo, useState } from "react"

import { rolesApi } from "@/api"
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
import { RoleDetailsDialog } from "@/features/roles/components/role-details-dialog"
import { RoleFormDialog } from "@/features/roles/components/role-form-dialog"
import { normalizeApiError } from "@/lib/http"
import type { ListRolesParams, Role, RoleId } from "@/types/roles"

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

export function RolesPage() {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState("")
  const [keywordInput, setKeywordInput] = useState("")
  const [page, setPage] = useState(1)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailRoleId, setDetailRoleId] = useState<RoleId | null>(null)
  const [editRoleId, setEditRoleId] = useState<RoleId | null>(null)
  const [deleteRole, setDeleteRole] = useState<Role | null>(null)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  const queryParams = useMemo<ListRolesParams>(() => {
    return {
      page,
      page_size: PAGE_SIZE,
      keyword: keyword.trim() || undefined,
    }
  }, [keyword, page])

  const rolesQuery = useQuery({
    queryKey: ["roles", queryParams],
    queryFn: () => rolesApi.listRoles(queryParams),
    placeholderData: (previous) => previous,
  })

  const deleteMutation = useMutation({
    mutationFn: (roleId: RoleId) => rolesApi.deleteRole(roleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] })
      await queryClient.invalidateQueries({ queryKey: ["permissions"] })
      setFeedback({
        type: "success",
        message: "角色已删除。",
      })
      setDeleteRole(null)
    },
    onError: (error) => {
      setFeedback({
        type: "error",
        message: normalizeApiError(error).message,
      })
    },
  })

  const items = rolesQuery.data?.items ?? []
  const total = rolesQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const systemRoleCount = items.filter((item) => item.is_system).length
  const customRoleCount = items.filter((item) => !item.is_system).length
  const assignedUserCount = items.reduce((sum, item) => sum + item.user_count, 0)

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
      <div className="grid gap-4 xl:grid-cols-4">
        <Card className="xl:col-span-1">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>角色总数</CardDescription>
            <CardTitle className="text-3xl">{total}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            基于当前筛选条件返回的角色记录总数。
          </CardContent>
        </Card>
        <Card className="xl:col-span-1">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>本页系统角色</CardDescription>
            <CardTitle className="text-3xl">{systemRoleCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            内置角色通常承载平台默认权限模型。
          </CardContent>
        </Card>
        <Card className="xl:col-span-1">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>本页自定义角色</CardDescription>
            <CardTitle className="text-3xl">{customRoleCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            便于识别业务新增的授权组合。
          </CardContent>
        </Card>
        <Card className="xl:col-span-1">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>本页绑定用户数</CardDescription>
            <CardTitle className="text-3xl">{assignedUserCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            反映当前页角色的实际使用覆盖情况。
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
            <CardTitle>角色列表</CardTitle>
            <CardDescription>支持检索、创建、编辑和删除角色，并查看角色权限绑定。</CardDescription>
          </div>

          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <ShieldCheck className="size-4" />
            新增角色
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
                placeholder="搜索角色编码或名称"
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

            <Button variant="outline" className="gap-2" onClick={() => rolesQuery.refetch()}>
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
                  <TableHead className="px-4">角色</TableHead>
                  <TableHead>权限</TableHead>
                  <TableHead>绑定用户</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead className="w-[80px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rolesQuery.isPending
                  ? Array.from({ length: 6 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell className="px-4">
                          <Skeleton className="h-14 w-full rounded-xl" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-32 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-16 rounded-full" />
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

                {!rolesQuery.isPending && items.length === 0 ? (
                  <TableRow>
                    <TableCell className="px-4 py-10 text-center text-muted-foreground" colSpan={6}>
                      当前筛选条件下没有找到角色。
                    </TableCell>
                  </TableRow>
                ) : null}

                {!rolesQuery.isPending
                  ? items.map((role) => {
                      const deleteDisabled = role.is_system || role.user_count > 0

                      return (
                        <TableRow key={role.id}>
                          <TableCell className="px-4">
                            <div className="space-y-1">
                              <div className="font-medium">{role.name}</div>
                              <div className="text-sm text-muted-foreground">{role.code}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <button
                                type="button"
                                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                onClick={() => setDetailRoleId(role.id)}
                              >
                                共 {role.permission_count} 项权限，点击查看完整列表
                              </button>
                              <div className="flex flex-wrap gap-2">
                                {role.permissions.slice(0, 2).map((permission) => (
                                  <Badge key={permission.id} variant="outline">
                                    {permission.name}
                                  </Badge>
                                ))}
                                {role.permission_count > 2 ? (
                                  <button type="button" onClick={() => setDetailRoleId(role.id)}>
                                    <Badge variant="secondary" className="cursor-pointer">
                                      +{role.permission_count - 2}
                                    </Badge>
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="inline-flex items-center gap-2 text-sm">
                              <UsersRound className="size-4 text-muted-foreground" />
                              <span>{role.user_count}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={role.is_system ? "secondary" : "outline"}>
                              {role.is_system ? "系统内置" : "自定义"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDateTime(role.updated_at)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <ShieldCheck className="size-4" />
                                  <span className="sr-only">打开角色操作菜单</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setDetailRoleId(role.id)}>
                                  <Eye />
                                  查看详情
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={role.is_system}
                                  onClick={() => setEditRoleId(role.id)}
                                >
                                  <Edit3 />
                                  {role.is_system ? "系统角色不可编辑" : "编辑角色"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  disabled={deleteDisabled}
                                  onClick={() => setDeleteRole(role)}
                                >
                                  <Trash2 />
                                  {role.is_system
                                    ? "系统角色不可删除"
                                    : role.user_count > 0
                                      ? "已绑定用户不可删除"
                                      : "删除角色"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
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

      <RoleDetailsDialog
        open={detailRoleId !== null}
        roleId={detailRoleId}
        onOpenChange={(open) => {
          if (!open) {
            setDetailRoleId(null)
          }
        }}
      />

      <RoleFormDialog
        open={createOpen}
        mode="create"
        roleId={null}
        onOpenChange={setCreateOpen}
        onSuccess={(message) => setFeedback({ type: "success", message })}
        onError={(message) => setFeedback({ type: "error", message })}
      />

      <RoleFormDialog
        open={editRoleId !== null}
        mode="edit"
        roleId={editRoleId}
        onOpenChange={(open) => {
          if (!open) {
            setEditRoleId(null)
          }
        }}
        onSuccess={(message) => setFeedback({ type: "success", message })}
        onError={(message) => setFeedback({ type: "error", message })}
      />

      <AlertDialog
        open={deleteRole !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteRole(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除该角色？</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteRole
                ? `删除后，角色 ${deleteRole.name}（${deleteRole.code}）将不可恢复，且无法继续被用户绑定。`
                : "删除后角色将不可恢复。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteRole) {
                  deleteMutation.mutate(deleteRole.id)
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
