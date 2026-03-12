import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react"
import { Link, Navigate, useNavigate } from "react-router-dom"

import { usersApi } from "@/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { normalizeApiError } from "@/lib/http"
import { useAuthStore } from "@/stores/auth-store"
import type { CreateUserPayload, Gender, StudentType, UserType } from "@/types/users"

interface RegisterFormValues {
  user_type: Extract<UserType, "student" | "teacher">
  unified_id: string
  password: string
  confirm_password: string
  name: string
  gender: Gender
  birthdate: string
  student_type: StudentType
  college: string
  major: string
  enrollment_year: string
  department: string
  title: string
}

const defaultValues: RegisterFormValues = {
  user_type: "student",
  unified_id: "",
  password: "",
  confirm_password: "",
  name: "",
  gender: "unknown",
  birthdate: "",
  student_type: "undergraduate",
  college: "",
  major: "",
  enrollment_year: "",
  department: "",
  title: "",
}

const featureHighlights = [
  {
    title: "学生注册",
    description: "支持按学生身份完成基础资料登记。",
    icon: GraduationCap,
  },
  {
    title: "教师注册",
    description: "支持教师账号自助录入院系与职称信息。",
    icon: ShieldCheck,
  },
  {
    title: "统一平台",
    description: "注册完成后可直接登录进入感知平台。",
    icon: Activity,
  },
]

function toOptionalText(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function toOptionalNumber(value: string) {
  const trimmed = value.trim()
  return trimmed ? Number(trimmed) : null
}

function toCreatePayload(values: RegisterFormValues): CreateUserPayload {
  const basePayload = {
    user_type: values.user_type,
    unified_id: values.unified_id.trim(),
    password: values.password,
    name: values.name.trim(),
    gender: values.gender,
    birthdate: values.birthdate || null,
  } as const

  if (values.user_type === "student") {
    return {
      ...basePayload,
      user_type: "student",
      student_type: values.student_type,
      college: toOptionalText(values.college),
      major: toOptionalText(values.major),
      enrollment_year: toOptionalNumber(values.enrollment_year),
    }
  }

  return {
    ...basePayload,
    user_type: "teacher",
    department: toOptionalText(values.department),
    title: toOptionalText(values.title),
  }
}

export function RegisterPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.currentUser)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)
  const form = useForm<RegisterFormValues>({
    mode: "onBlur",
    defaultValues,
  })

  const userType =
    useWatch({
      control: form.control,
      name: "user_type",
    }) ?? "student"

  if (currentUser) {
    return <Navigate replace to="/admin/users" />
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      await usersApi.createUser(toCreatePayload(values))
      setSubmitSuccess("注册成功，账号已创建。你现在可以返回登录页进行登录。")
      form.reset(defaultValues)
      setTimeout(() => {
        navigate("/login", { replace: true })
      }, 1000)
    } catch (error) {
      setSubmitError(normalizeApiError(error).message)
    }
  })

  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.08),_transparent_35%),linear-gradient(180deg,_rgba(248,250,252,1)_0%,_rgba(241,245,249,0.88)_100%)]">
      <div className="grid min-h-svh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <section className="relative overflow-hidden px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
          <div className="absolute inset-0 bg-[linear-gradient(145deg,_rgba(15,23,42,0.98)_0%,_rgba(30,41,59,0.94)_45%,_rgba(8,47,73,0.92)_100%)]" />
          <div className="absolute left-1/2 top-0 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-cyan-300/12 blur-3xl" />
          <div className="absolute -left-24 top-24 h-64 w-64 rounded-full bg-cyan-400/12 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-sky-300/8 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white shadow-[0_12px_40px_rgba(15,23,42,0.28)] backdrop-blur-md">
                <LayoutDashboard className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium tracking-[0.24em] text-sky-100/70 uppercase">
                  Intelligent Perception Platform
                </p>
                <h1 className="text-xl font-semibold text-white">注册智能感知平台账号</h1>
              </div>
            </div>

            <div className="max-w-2xl space-y-8 py-12">
              <div className="space-y-4">
                <h2 className="max-w-xl text-4xl leading-tight font-semibold text-white sm:text-5xl">
                  快速完成用户注册，接入统一后台能力。
                </h2>
                <p className="max-w-xl text-base leading-7 text-slate-200/82 sm:text-lg">
                  面向学生与教师的自助注册入口，完成基础信息填写后即可登录平台，查看个人权限范围内的功能模块。
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {featureHighlights.map(({ title, description, icon: Icon }) => (
                  <div
                    key={title}
                    className="rounded-3xl border border-white/12 bg-white/10 px-5 pt-6 pb-5 backdrop-blur-md"
                  >
                    <div className="mb-5 flex size-10 items-center justify-center rounded-2xl bg-white/12 text-sky-100">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-200/78">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1 text-sm text-slate-300/72 sm:flex-row sm:items-center sm:justify-between">
              <p>智能感知实验室</p>
              <p>© 2026 Intelligent Perception Laboratory. All rights reserved.</p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12">
          <div className="w-full max-w-xl">
            <Card className="border-slate-200/80 bg-white/92 text-slate-950 shadow-2xl shadow-slate-900/8 backdrop-blur-sm">
              <CardHeader className="space-y-3">
                <div className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                  开放注册
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-semibold tracking-tight text-slate-950">
                    创建账号
                  </CardTitle>
                  <CardDescription className="text-sm leading-6 text-slate-500">
                    目前支持学生和教师账号注册。管理员账号仍需由后台管理员创建。
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent>
                <form className="space-y-5" onSubmit={onSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="user_type" className="text-slate-900">
                        注册类型
                      </Label>
                      <Controller
                        control={form.control}
                        name="user_type"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="w-full border-slate-200 bg-white text-slate-950 shadow-sm">
                              <SelectValue placeholder="选择注册类型" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">学生</SelectItem>
                              <SelectItem value="teacher">教师</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unified_id" className="text-slate-900">
                        统一身份账号
                      </Label>
                      <Input
                        id="unified_id"
                        className="border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 shadow-sm"
                        placeholder="请输入账号"
                        aria-invalid={form.formState.errors.unified_id ? true : undefined}
                        {...form.register("unified_id", {
                          required: "请输入统一身份账号",
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-900">
                        姓名
                      </Label>
                      <Input
                        id="name"
                        className="border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 shadow-sm"
                        placeholder="请输入姓名"
                        aria-invalid={form.formState.errors.name ? true : undefined}
                        {...form.register("name", {
                          required: "请输入姓名",
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-slate-900">
                        性别
                      </Label>
                      <Controller
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="w-full border-slate-200 bg-white text-slate-950 shadow-sm">
                              <SelectValue placeholder="选择性别" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unknown">未知</SelectItem>
                              <SelectItem value="male">男</SelectItem>
                              <SelectItem value="female">女</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="birthdate" className="text-slate-900">
                        出生日期
                      </Label>
                      <Input
                        id="birthdate"
                        type="date"
                        className="border-slate-200 bg-white text-slate-950 shadow-sm"
                        {...form.register("birthdate")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-900">
                        登录密码
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={isPasswordVisible ? "text" : "password"}
                          className="border-slate-200 bg-white pr-10 text-slate-950 placeholder:text-slate-400 shadow-sm"
                          placeholder="请输入密码"
                          aria-invalid={form.formState.errors.password ? true : undefined}
                          {...form.register("password", {
                            required: "请输入登录密码",
                            minLength: {
                              value: 6,
                              message: "密码至少 6 位",
                            },
                          })}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-slate-400 transition-colors hover:text-slate-600"
                          onClick={() => setIsPasswordVisible((value) => !value)}
                        >
                          {isPasswordVisible ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm_password" className="text-slate-900">
                        确认密码
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirm_password"
                          type={isConfirmPasswordVisible ? "text" : "password"}
                          className="border-slate-200 bg-white pr-10 text-slate-950 placeholder:text-slate-400 shadow-sm"
                          placeholder="请再次输入密码"
                          aria-invalid={form.formState.errors.confirm_password ? true : undefined}
                          {...form.register("confirm_password", {
                            required: "请再次输入密码",
                            validate: (value) =>
                              value === form.getValues("password") || "两次输入的密码不一致",
                          })}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-slate-400 transition-colors hover:text-slate-600"
                          onClick={() => setIsConfirmPasswordVisible((value) => !value)}
                        >
                          {isConfirmPasswordVisible ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {userType === "student" ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="student_type" className="text-slate-900">
                            学生类型
                          </Label>
                          <Controller
                            control={form.control}
                            name="student_type"
                            render={({ field }) => (
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger className="w-full border-slate-200 bg-white text-slate-950 shadow-sm">
                                  <SelectValue placeholder="选择学生类型" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="undergraduate">本科生</SelectItem>
                                  <SelectItem value="master">硕士生</SelectItem>
                                  <SelectItem value="phd">博士生</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="enrollment_year" className="text-slate-900">
                            入学年份
                          </Label>
                          <Input
                            id="enrollment_year"
                            type="number"
                            className="border-slate-200 bg-white text-slate-950 shadow-sm"
                            placeholder="例如 2024"
                            {...form.register("enrollment_year")}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="college" className="text-slate-900">
                            学院
                          </Label>
                          <Input
                            id="college"
                            className="border-slate-200 bg-white text-slate-950 shadow-sm"
                            placeholder="请输入学院"
                            {...form.register("college")}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="major" className="text-slate-900">
                            专业
                          </Label>
                          <Input
                            id="major"
                            className="border-slate-200 bg-white text-slate-950 shadow-sm"
                            placeholder="请输入专业"
                            {...form.register("major")}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="department" className="text-slate-900">
                            院系
                          </Label>
                          <Input
                            id="department"
                            className="border-slate-200 bg-white text-slate-950 shadow-sm"
                            placeholder="请输入院系"
                            {...form.register("department")}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="title" className="text-slate-900">
                            职称
                          </Label>
                          <Input
                            id="title"
                            className="border-slate-200 bg-white text-slate-950 shadow-sm"
                            placeholder="请输入职称"
                            {...form.register("title")}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {form.formState.errors.password ? (
                    <p className="text-sm text-destructive" role="alert">
                      {form.formState.errors.password.message}
                    </p>
                  ) : null}

                  {form.formState.errors.confirm_password ? (
                    <p className="text-sm text-destructive" role="alert">
                      {form.formState.errors.confirm_password.message}
                    </p>
                  ) : null}

                  {submitError ? (
                    <div className="rounded-2xl border border-destructive/20 bg-destructive/6 px-4 py-3 text-sm leading-6 text-destructive">
                      {submitError}
                    </div>
                  ) : null}

                  {submitSuccess ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
                      {submitSuccess}
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    <Button
                      className="h-11 w-full bg-slate-950 text-sm text-white hover:bg-slate-900"
                      disabled={form.formState.isSubmitting}
                      type="submit"
                    >
                      {form.formState.isSubmitting ? "注册中..." : "完成注册"}
                      <ArrowRight className="size-4" />
                    </Button>

                    <div className="flex items-center justify-between text-sm">
                      <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-slate-500 transition-colors hover:text-slate-900"
                      >
                        <ArrowLeft className="size-4" />
                        返回登录
                      </Link>
                      <span className="text-slate-500">
                        已有账号？{" "}
                        <Link to="/login" className="font-medium text-slate-900 underline-offset-4 hover:underline">
                          立即登录
                        </Link>
                      </span>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
