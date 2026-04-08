import { describe, expect, it } from "vitest"

import {
  buildRabbitMQPermissionBindingPayload,
  defaultRabbitMQBindingFormValues,
  getRabbitMQPermissionLevelOptions,
} from "@/features/permissions/lib/rabbitmq-binding-form"

describe("buildRabbitMQPermissionBindingPayload", () => {
  it("only keeps rabbitmq_tag for user bindings", () => {
    const payload = buildRabbitMQPermissionBindingPayload({
      ...defaultRabbitMQBindingFormValues,
      check_type: "user",
      rabbitmq_tag: "administrator",
      vhost_pattern: "/prod",
      resource_name_pattern: "sensor.*",
      routing_key_pattern: "campus.#",
    })

    expect(payload).toEqual({
      check_type: "user",
      rabbitmq_tag: "administrator",
    })
  })

  it("normalizes resource bindings and strips topic-only fields", () => {
    const payload = buildRabbitMQPermissionBindingPayload({
      ...defaultRabbitMQBindingFormValues,
      check_type: "resource",
      vhost_pattern: "",
      resource_type: "exchange",
      permission_level: "write",
      resource_name_pattern: "telemetry.events",
      routing_key_pattern: "ignored.#",
    })

    expect(payload).toEqual({
      check_type: "resource",
      vhost_pattern: "*",
      resource_type: "exchange",
      permission_level: "write",
      resource_name_pattern: "telemetry.events",
    })
  })

  it("forces topic bindings to use the topic resource type", () => {
    const payload = buildRabbitMQPermissionBindingPayload({
      ...defaultRabbitMQBindingFormValues,
      check_type: "topic",
      resource_type: "queue",
      permission_level: "read",
      resource_name_pattern: "amq.topic",
      routing_key_pattern: "sensor.alert.#",
    })

    expect(payload).toEqual({
      check_type: "topic",
      vhost_pattern: "*",
      resource_type: "topic",
      permission_level: "read",
      resource_name_pattern: "amq.topic",
      routing_key_pattern: "sensor.alert.#",
    })
  })

  it("removes configure from topic permission level options", () => {
    expect(getRabbitMQPermissionLevelOptions("topic").map((option) => option.value)).toEqual([
      "write",
      "read",
    ])
    expect(getRabbitMQPermissionLevelOptions("resource").map((option) => option.value)).toEqual([
      "configure",
      "write",
      "read",
    ])
  })
})
