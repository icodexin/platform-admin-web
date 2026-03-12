import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"

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
import { normalizeApiError } from "@/lib/http"
import { useAuthStore } from "@/stores/auth-store"

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ChangePasswordFormValues {
  password: string
  confirmPassword: string
}

const defaultValues: ChangePasswordFormValues = {
  password: "",
  confirmPassword: "",
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const queryClient = useQueryClient()
  const closeTimerRef = useRef<number | null>(null)
  const currentUser = useAuthStore((state) => state.currentUser)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const form = useForm<ChangePasswordFormValues>({
    mode: "onBlur",
    defaultValues,
  })

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  const mutation = useMutation({
    mutationFn: async (values: ChangePasswordFormValues) => {
      if (!currentUser) {
        throw new Error("当前用户信息未加载")
      }

      return usersApi.updateUser(currentUser.id, {
        password: values.password,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "current-user"] })
      await queryClient.invalidateQueries({ queryKey: ["auth", "profile-dialog"] })
      setFeedback({
        type: "success",
        message: "密码已更新。",
      })
      form.reset(defaultValues)
      closeTimerRef.current = window.setTimeout(() => {
        onOpenChange(false)
      }, 600)
    },
    onError: (error) => {
      setFeedback({
        type: "error",
        message: normalizeApiError(error).message,
      })
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          form.reset(defaultValues)
          setFeedback(null)
        }

        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>修改密码</DialogTitle>
          <DialogDescription>设置新的登录密码，提交后立即生效。</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="space-y-2">
            <Label htmlFor="new-password">新密码</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={form.formState.errors.password ? true : undefined}
              {...form.register("password", {
                required: "请输入新密码",
                minLength: {
                  value: 6,
                  message: "密码至少 6 位",
                },
              })}
            />
            {form.formState.errors.password ? (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">确认新密码</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={form.formState.errors.confirmPassword ? true : undefined}
              {...form.register("confirmPassword", {
                required: "请再次输入新密码",
                validate: (value) =>
                  value === form.getValues("password") || "两次输入的密码不一致",
              })}
            />
            {form.formState.errors.confirmPassword ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            ) : null}
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button disabled={mutation.isPending || !currentUser} type="submit">
              {mutation.isPending ? "提交中..." : "确认修改"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
