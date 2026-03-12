import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Ban, Eye, PencilLine, Plus, RefreshCcw, Search, UsersRound } from "lucide-react"
import { startTransition, useMemo, useState } from "react"

import { usersApi } from "@/api"
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
import { UserDetailsDialog } from "@/features/users/components/user-details-dialog"
import { UserFormDialog } from "@/features/users/components/user-form-dialog"
import {
  formatDateTime,
  formatUserType,
  getUserTypeDescription,
} from "@/features/users/lib/user-meta"
import { normalizeApiError } from "@/lib/http"
import { useAuthStore } from "@/stores/auth-store"
import type { ListUsersParams, User, UserId, UserType } from "@/types/users"

type StatusFilter = "all" | "active" | "inactive"

const PAGE_SIZE = 10

function toIsActive(status: StatusFilter) {
  if (status === "active") {
    return true
  }

  if (status === "inactive") {
    return false
  }

  return undefined
}

function UserTypeBadge({ userType }: { userType: UserType }) {
  return <Badge variant="outline">{formatUserType(userType)}</Badge>
}

function UserStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "secondary" : "outline"}>
      {isActive ? "正常" : "已停用"}
    </Badge>
  )
}

export function UsersPage() {
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.currentUser)

  const [keyword, setKeyword] = useState("")
  const [keywordInput, setKeywordInput] = useState("")
  const [userType, setUserType] = useState<UserType | "all">("all")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [page, setPage] = useState(1)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editUserId, setEditUserId] = useState<UserId | null>(null)
  const [detailUserId, setDetailUserId] = useState<UserId | null>(null)
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null)

  const queryParams = useMemo<ListUsersParams>(() => {
    return {
      page,
      page_size: PAGE_SIZE,
      keyword: keyword.trim() || undefined,
      user_type: userType === "all" ? undefined : userType,
      is_active: toIsActive(status),
    }
  }, [keyword, page, status, userType])

  const usersQuery = useQuery({
    queryKey: ["users", queryParams],
    queryFn: () => usersApi.listUsers(queryParams),
    placeholderData: (previous) => previous,
  })

  const deactivateMutation = useMutation({
    mutationFn: (userId: UserId) => usersApi.deactivateUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] })
      await queryClient.invalidateQueries({ queryKey: ["auth", "current-user"] })
      setFeedback({
        type: "success",
        message: "用户账号已停用。",
      })
      setDeactivateUser(null)
    },
    onError: (error) => {
      setFeedback({
        type: "error",
        message: normalizeApiError(error).message,
      })
    },
  })

  const items = usersQuery.data?.items ?? []
  const total = usersQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const activeCount = items.filter((item) => item.is_active).length
  const studentCount = items.filter((item) => item.user_type === "student").length
  const teacherCount = items.filter((item) => item.user_type === "teacher").length

  const handleQueryFeedback = (message: string, type: "success" | "error" = "success") => {
    setFeedback({ type, message })
  }

  const resetFilters = () => {
    startTransition(() => {
      setKeyword("")
      setKeywordInput("")
      setUserType("all")
      setStatus("all")
      setPage(1)
    })
  }

  const submitSearch = () => {
    startTransition(() => {
      setKeyword(keywordInput)
      setPage(1)
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-4">
        <Card className="xl:col-span-1">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>当前总用户数</CardDescription>
            <CardTitle className="text-3xl">{total}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            基于当前筛选条件返回的总记录数。
          </CardContent>
        </Card>
        <Card className="xl:col-span-1">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>本页正常账号</CardDescription>
            <CardTitle className="text-3xl">{activeCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            当前页中处于可用状态的账号数量。
          </CardContent>
        </Card>
        <Card className="xl:col-span-1">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>本页学生账号</CardDescription>
            <CardTitle className="text-3xl">{studentCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            便于快速确认学生账号分布情况。
          </CardContent>
        </Card>
        <Card className="xl:col-span-1">
          <CardHeader className="space-y-1 pb-3">
            <CardDescription>本页教师账号</CardDescription>
            <CardTitle className="text-3xl">{teacherCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            管理教师账号与角色状态的入口。
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
            <CardTitle>用户列表</CardTitle>
            <CardDescription>支持检索、查看、创建、编辑与停用用户账号。</CardDescription>
          </div>

          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            新增用户
          </Button>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto_auto]">
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
                placeholder="搜索账号或姓名"
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

            <Select
              value={userType}
              onValueChange={(value) => {
                startTransition(() => {
                  setUserType(value as UserType | "all")
                  setPage(1)
                })
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="筛选用户类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="student">学生</SelectItem>
                <SelectItem value="teacher">教师</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={status}
              onValueChange={(value) => {
                startTransition(() => {
                  setStatus(value as StatusFilter)
                  setPage(1)
                })
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="筛选账号状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">正常</SelectItem>
                <SelectItem value="inactive">已停用</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => usersQuery.refetch()}
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
                  <TableHead className="px-4">用户</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead className="w-[80px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersQuery.isPending
                  ? Array.from({ length: 6 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell className="px-4">
                          <Skeleton className="h-14 w-full rounded-xl" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-28 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-16 rounded-full" />
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

                {!usersQuery.isPending && items.length === 0 ? (
                  <TableRow>
                    <TableCell className="px-4 py-10 text-center text-muted-foreground" colSpan={6}>
                      当前筛选条件下没有找到用户。
                    </TableCell>
                  </TableRow>
                ) : null}

                {!usersQuery.isPending
                  ? items.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="px-4">
                          <div className="space-y-1">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.unified_id} · {getUserTypeDescription(user)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <UserTypeBadge userType={user.user_type} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {user.roles.map((role) => (
                              <Badge key={role} variant="outline">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <UserStatusBadge isActive={user.is_active} />
                        </TableCell>
                        <TableCell>{formatDateTime(user.updated_at)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <UsersRound className="size-4" />
                                <span className="sr-only">打开操作菜单</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetailUserId(user.id)}>
                                <Eye />
                                查看详情
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditUserId(user.id)}>
                                <PencilLine />
                                编辑用户
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                disabled={!user.is_active || currentUser?.id === user.id}
                                onClick={() => setDeactivateUser(user)}
                              >
                                <Ban />
                                {!user.is_active ? "账号已停用" : currentUser?.id === user.id ? "不可停用自己" : "停用账号"}
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

      <UserFormDialog
        open={createOpen}
        mode="create"
        userId={null}
        onOpenChange={setCreateOpen}
        onSuccess={(message) => handleQueryFeedback(message)}
        onError={(message) => handleQueryFeedback(message, "error")}
      />

      <UserFormDialog
        open={editUserId !== null}
        mode="edit"
        userId={editUserId}
        onOpenChange={(open) => {
          if (!open) {
            setEditUserId(null)
          }
        }}
        onSuccess={(message) => handleQueryFeedback(message)}
        onError={(message) => handleQueryFeedback(message, "error")}
      />

      <UserDetailsDialog
        open={detailUserId !== null}
        userId={detailUserId}
        onOpenChange={(open) => {
          if (!open) {
            setDetailUserId(null)
          }
        }}
      />

      <AlertDialog
        open={deactivateUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeactivateUser(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认停用该用户？</AlertDialogTitle>
            <AlertDialogDescription>
              {deactivateUser
                ? `停用后，用户 ${deactivateUser.name}（${deactivateUser.unified_id}）将无法继续正常访问系统。`
                : "停用后用户将无法继续访问系统。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deactivateUser) {
                  deactivateMutation.mutate(deactivateUser.id)
                }
              }}
            >
              {deactivateMutation.isPending ? "停用中..." : "确认停用"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
