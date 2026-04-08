import type {
  CreateRabbitMQPermissionBindingPayload,
  RabbitMQBindingCheckType,
  RabbitMQBindingPermissionLevel,
  RabbitMQBindingResourceType,
  RabbitMQBindingTag,
  RabbitMQPermissionBinding,
} from "@/types/permissions"

export interface RabbitMQBindingFormValues {
  check_type: RabbitMQBindingCheckType
  vhost_pattern: string
  resource_type: RabbitMQBindingResourceType
  resource_name_pattern: string
  permission_level: RabbitMQBindingPermissionLevel
  routing_key_pattern: string
  rabbitmq_tag: RabbitMQBindingTag
}

export const rabbitMQCheckTypeOptions = [
  {
    value: "user",
    label: "用户标签",
    description: "为通过该权限的用户分配 RabbitMQ 管理标签。",
  },
  {
    value: "vhost",
    label: "Vhost 访问",
    description: "限定用户可访问的虚拟主机范围。",
  },
  {
    value: "resource",
    label: "资源访问",
    description: "按队列或交换机定义 configure/write/read 权限。",
  },
  {
    value: "topic",
    label: "Topic 路由",
    description: "按 topic 名称与 routing key 进一步细化访问范围。",
  },
] as const satisfies Array<{
  value: RabbitMQBindingCheckType
  label: string
  description: string
}>

export const rabbitMQPermissionLevelOptions = [
  { value: "configure", label: "configure" },
  { value: "write", label: "write" },
  { value: "read", label: "read" },
] as const satisfies Array<{
  value: RabbitMQBindingPermissionLevel
  label: string
}>

export function getRabbitMQPermissionLevelOptions(checkType: RabbitMQBindingCheckType) {
  if (checkType === "topic") {
    return rabbitMQPermissionLevelOptions.filter((option) => option.value !== "configure")
  }

  return rabbitMQPermissionLevelOptions
}

export const rabbitMQResourceTypeOptions = [
  { value: "queue", label: "queue" },
  { value: "exchange", label: "exchange" },
] as const satisfies Array<{
  value: Exclude<RabbitMQBindingResourceType, "topic">
  label: string
}>

export const rabbitMQTagOptions = [
  { value: "management", label: "management" },
  { value: "policymaker", label: "policymaker" },
  { value: "monitoring", label: "monitoring" },
  { value: "administrator", label: "administrator" },
] as const satisfies Array<{
  value: RabbitMQBindingTag
  label: string
}>

export const rabbitMQCheckTypeLabels: Record<RabbitMQBindingCheckType, string> = {
  user: "用户标签",
  vhost: "Vhost 访问",
  resource: "资源访问",
  topic: "Topic 路由",
}

export const rabbitMQPermissionLevelLabels: Record<RabbitMQBindingPermissionLevel, string> = {
  configure: "configure",
  write: "write",
  read: "read",
}

export const rabbitMQResourceTypeLabels: Record<RabbitMQBindingResourceType, string> = {
  exchange: "exchange",
  queue: "queue",
  topic: "topic",
}

export const rabbitMQTagLabels: Record<RabbitMQBindingTag, string> = {
  management: "management",
  policymaker: "policymaker",
  monitoring: "monitoring",
  administrator: "administrator",
}

export const defaultRabbitMQBindingFormValues: RabbitMQBindingFormValues = {
  check_type: "resource",
  vhost_pattern: "*",
  resource_type: "queue",
  resource_name_pattern: "",
  permission_level: "read",
  routing_key_pattern: "",
  rabbitmq_tag: "management",
}

export function getRabbitMQBindingFormValues(
  binding: RabbitMQPermissionBinding,
): RabbitMQBindingFormValues {
  return {
    check_type: binding.check_type,
    vhost_pattern: binding.vhost_pattern ?? "*",
    resource_type:
      binding.check_type === "topic" ? "topic" : (binding.resource_type ?? "queue"),
    resource_name_pattern: binding.resource_name_pattern ?? "",
    permission_level: binding.permission_level ?? "read",
    routing_key_pattern: binding.routing_key_pattern ?? "",
    rabbitmq_tag: binding.rabbitmq_tag ?? "management",
  }
}

function trimText(value: string) {
  return value.trim()
}

export function buildRabbitMQPermissionBindingPayload(
  values: RabbitMQBindingFormValues,
): CreateRabbitMQPermissionBindingPayload {
  const vhostPattern = trimText(values.vhost_pattern) || "*"
  const resourceNamePattern = trimText(values.resource_name_pattern)
  const routingKeyPattern = trimText(values.routing_key_pattern)

  if (values.check_type === "user") {
    return {
      check_type: "user",
      rabbitmq_tag: values.rabbitmq_tag,
    }
  }

  if (values.check_type === "vhost") {
    return {
      check_type: "vhost",
      vhost_pattern: vhostPattern,
    }
  }

  if (values.check_type === "topic") {
    return {
      check_type: "topic",
      vhost_pattern: vhostPattern,
      resource_type: "topic",
      permission_level: values.permission_level,
      resource_name_pattern: resourceNamePattern,
      routing_key_pattern: routingKeyPattern,
    }
  }

  return {
    check_type: "resource",
    vhost_pattern: vhostPattern,
    resource_type: values.resource_type,
    permission_level: values.permission_level,
    resource_name_pattern: resourceNamePattern,
  }
}
