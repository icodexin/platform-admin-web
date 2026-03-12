import { useQuery } from "@tanstack/react-query"

import { usersApi } from "@/api"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  formatDate,
  formatDateTime,
  formatGender,
  formatStudentType,
  formatUserType,
} from "@/features/users/lib/user-meta"
import type { UserId } from "@/types/users"

interface UserDetailsDialogProps {
  open: boolean
  userId: UserId | null
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

export function UserDetailsDialog({
  open,
  userId,
  onOpenChange,
}: UserDetailsDialogProps) {
  const userQuery = useQuery({
    queryKey: ["users", "detail", userId],
    queryFn: () => usersApi.getUserById(userId!),
    enabled: open && userId !== null,
  })

  const user = userQuery.data

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>用户详情</DialogTitle>
          <DialogDescription>查看当前用户的身份、状态与扩展资料。</DialogDescription>
        </DialogHeader>

        {userQuery.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : null}

        {user ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>{formatUserType(user.user_type)}</Badge>
              <Badge variant={user.is_active ? "secondary" : "outline"}>
                {user.is_active ? "正常" : "已停用"}
              </Badge>
              {user.roles.map((role) => (
                <Badge key={role} variant="outline">
                  {role}
                </Badge>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="用户 ID" value={String(user.id)} />
              <Field label="统一身份账号" value={user.unified_id} />
              <Field label="姓名" value={user.name} />
              <Field label="性别" value={formatGender(user.gender)} />
              <Field label="出生日期" value={formatDate(user.birthdate)} />
              <Field label="创建时间" value={formatDateTime(user.created_at)} />
              <Field label="更新时间" value={formatDateTime(user.updated_at)} />

              {user.user_type === "student" ? (
                <>
                  <Field label="学生类型" value={formatStudentType(user.student_type)} />
                  <Field label="学院" value={user.college || "未填写"} />
                  <Field label="专业" value={user.major || "未填写"} />
                  <Field
                    label="入学年份"
                    value={user.enrollment_year ? String(user.enrollment_year) : "未填写"}
                  />
                </>
              ) : null}

              {user.user_type === "teacher" ? (
                <>
                  <Field label="院系" value={user.department || "未填写"} />
                  <Field label="职称" value={user.title || "未填写"} />
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
