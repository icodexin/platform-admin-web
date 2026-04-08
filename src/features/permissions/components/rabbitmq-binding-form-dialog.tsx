import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  buildRabbitMQPermissionBindingPayload,
  defaultRabbitMQBindingFormValues,
  getRabbitMQBindingFormValues,
  getRabbitMQPermissionLevelOptions,
  rabbitMQCheckTypeLabels,
  rabbitMQCheckTypeOptions,
  rabbitMQResourceTypeOptions,
  rabbitMQTagOptions,
  type RabbitMQBindingFormValues,
} from "@/features/permissions/lib/rabbitmq-binding-form"
import { normalizeApiError } from "@/lib/http"
import type {
  PermissionId,
  RabbitMQPermissionBindingId,
} from "@/types/permissions"

interface RabbitMQBindingFormDialogProps {
  open: boolean
  mode: "create" | "edit"
  permissionId: PermissionId | null
  permissionName?: string
  bindingId: RabbitMQPermissionBindingId | null
  onOpenChange: (open: boolean) => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

function getCheckTypeDescription(checkType: RabbitMQBindingFormValues["check_type"]) {
  return (
    rabbitMQCheckTypeOptions.find((option) => option.value === checkType)?.description ??
    ""
  )
}

export function RabbitMQBindingFormDialog({
  open,
  mode,
  permissionId,
  permissionName,
  bindingId,
  onOpenChange,
  onSuccess,
  onError,
}: RabbitMQBindingFormDialogProps) {
  const queryClient = useQueryClient()
  const form = useForm<RabbitMQBindingFormValues>({
    mode: "onBlur",
    defaultValues: defaultRabbitMQBindingFormValues,
  })

  const bindingQuery = useQuery({
    queryKey: ["permissions", "rabbitmq-bindings", "detail", permissionId, bindingId],
    queryFn: () =>
      permissionsApi.getRabbitMQPermissionBindingById(permissionId!, bindingId!),
    enabled: open && mode === "edit" && permissionId !== null && bindingId !== null,
  })

  useEffect(() => {
    if (!open) {
      form.reset(defaultRabbitMQBindingFormValues)
      return
    }

    if (mode === "create") {
      form.reset(defaultRabbitMQBindingFormValues)
      return
    }

    if (bindingQuery.data) {
      form.reset(getRabbitMQBindingFormValues(bindingQuery.data))
    }
  }, [bindingQuery.data, form, mode, open])

  const checkType =
    useWatch({
      control: form.control,
      name: "check_type",
    }) ?? "resource"

  useEffect(() => {
    if (checkType === "topic" && form.getValues("resource_type") !== "topic") {
      form.setValue("resource_type", "topic", {
        shouldDirty: true,
      })
    }

    if (checkType === "topic" && form.getValues("permission_level") === "configure") {
      form.setValue("permission_level", "read", {
        shouldDirty: true,
      })
    }
  }, [checkType, form])

  const permissionLevelOptions = getRabbitMQPermissionLevelOptions(checkType)

  const mutation = useMutation({
    mutationFn: async (values: RabbitMQBindingFormValues) => {
      const payload = buildRabbitMQPermissionBindingPayload(values)

      if (mode === "create") {
        return permissionsApi.createRabbitMQPermissionBinding(permissionId!, payload)
      }

      return permissionsApi.updateRabbitMQPermissionBinding(
        permissionId!,
        bindingId!,
        payload,
      )
    },
    onSuccess: async (binding) => {
      await queryClient.invalidateQueries({
        queryKey: ["permissions", "rabbitmq-bindings", permissionId],
      })
      await queryClient.invalidateQueries({
        queryKey: ["permissions", "rabbitmq-bindings", "detail", permissionId, binding.id],
      })

      onSuccess(mode === "create" ? "RabbitMQ 权限绑定已创建。" : "RabbitMQ 权限绑定已更新。")
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
          <DialogTitle>
            {mode === "create" ? "新增 RabbitMQ 绑定" : "编辑 RabbitMQ 绑定"}
          </DialogTitle>
          <DialogDescription>
            {permissionName
              ? `当前正在为权限 ${permissionName} 配置 RabbitMQ 授权规则。`
              : "按 check_type 填写与该权限对应的 RabbitMQ 授权规则。"}
          </DialogDescription>
        </DialogHeader>

        {mode === "edit" && bindingQuery.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : mode === "edit" && bindingQuery.isError ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            {normalizeApiError(bindingQuery.error).message}
          </div>
        ) : (
          <form
            className="space-y-6"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="check_type">校验类型</Label>
                <Controller
                  control={form.control}
                  name="check_type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择校验类型" />
                      </SelectTrigger>
                      <SelectContent>
                        {rabbitMQCheckTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <div className="rounded-2xl border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                  <div className="font-medium text-foreground">
                    {rabbitMQCheckTypeLabels[checkType]}
                  </div>
                  <div className="mt-1">{getCheckTypeDescription(checkType)}</div>
                </div>
              </div>

              {checkType !== "user" ? (
                <div className="space-y-2">
                  <Label htmlFor="vhost_pattern">Vhost 匹配</Label>
                  <Input
                    id="vhost_pattern"
                    placeholder="默认 *"
                    {...form.register("vhost_pattern")}
                  />
                </div>
              ) : null}

              {checkType === "user" ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="rabbitmq_tag">RabbitMQ 标签</Label>
                  <Controller
                    control={form.control}
                    name="rabbitmq_tag"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="选择 RabbitMQ 标签" />
                        </SelectTrigger>
                        <SelectContent>
                          {rabbitMQTagOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              ) : null}

              {checkType === "resource" || checkType === "topic" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="resource_type">资源类型</Label>
                    <Controller
                      control={form.control}
                      name="resource_type"
                      render={({ field }) => (
                        <Select
                          value={checkType === "topic" ? "topic" : field.value}
                          onValueChange={field.onChange}
                          disabled={checkType === "topic"}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="选择资源类型" />
                          </SelectTrigger>
                          <SelectContent>
                            {checkType === "topic" ? (
                              <SelectItem value="topic">topic</SelectItem>
                            ) : (
                              rabbitMQResourceTypeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="permission_level">权限级别</Label>
                    <Controller
                      control={form.control}
                      name="permission_level"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="选择权限级别" />
                          </SelectTrigger>
                          <SelectContent>
                            {permissionLevelOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="resource_name_pattern">资源名称匹配</Label>
                    <Input
                      id="resource_name_pattern"
                      placeholder={checkType === "topic" ? "例如 amq.topic" : "例如 sensor.*"}
                      aria-invalid={form.formState.errors.resource_name_pattern ? true : undefined}
                      {...form.register("resource_name_pattern", {
                        validate: (value) => {
                          if (
                            (checkType === "resource" || checkType === "topic") &&
                            !value.trim()
                          ) {
                            return "请输入资源名称匹配"
                          }

                          return true
                        },
                      })}
                    />
                    {form.formState.errors.resource_name_pattern ? (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.resource_name_pattern.message}
                      </p>
                    ) : null}
                  </div>
                </>
              ) : null}

              {checkType === "topic" ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="routing_key_pattern">Routing Key 匹配</Label>
                  <Input
                    id="routing_key_pattern"
                    placeholder="例如 sensor.alert.#"
                    aria-invalid={form.formState.errors.routing_key_pattern ? true : undefined}
                    {...form.register("routing_key_pattern", {
                      validate: (value) => {
                        if (checkType === "topic" && !value.trim()) {
                          return "请输入 routing key 匹配"
                        }

                        return true
                      },
                    })}
                  />
                  {form.formState.errors.routing_key_pattern ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.routing_key_pattern.message}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button disabled={mutation.isPending || permissionId === null} type="submit">
                {mutation.isPending
                  ? "提交中..."
                  : mode === "create"
                    ? "创建绑定"
                    : "保存修改"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
