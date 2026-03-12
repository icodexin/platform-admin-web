import { useState } from "react"
import { useForm } from "react-hook-form"
import {
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  LayoutDashboard,
  ServerCog,
  ShieldCheck,
} from "lucide-react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"

import { authApi, usersApi } from "@/api"
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
  clearStoredAuthTokens,
  setStoredAuthTokens,
} from "@/lib/auth/token-storage"
import { normalizeApiError } from "@/lib/http"
import { useAuthStore } from "@/stores/auth-store"

interface LoginFormValues {
  username: string
  password: string
}

const featureHighlights = [
  {
    title: "用户与权限",
    description: "统一管理学生、教师与管理员账号权限。",
    icon: ShieldCheck,
  },
  {
    title: "传感器监控",
    description: "快速查看设备状态、指标波动与异常预警。",
    icon: Activity,
  },
  {
    title: "服务运维",
    description: "集中管理系统服务运行状态与可用性。",
    icon: ServerCog,
  },
]

export function LoginPage() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const currentUser = useAuthStore((state) => state.currentUser)
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser)

  const from = (
    location.state as { from?: { pathname?: string } } | null
  )?.from?.pathname

  if (currentUser) {
    return <Navigate replace to="/admin/users" />
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    mode: "onBlur",
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)

    try {
      const tokenResponse = await authApi.login(values)

      setStoredAuthTokens({
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
      })

      const user = await usersApi.getCurrentUser()

      setCurrentUser(user)
      navigate(from || "/admin/users", { replace: true })
    } catch (error) {
      clearStoredAuthTokens()
      setCurrentUser(null)
      setSubmitError(normalizeApiError(error).message)
    }
  })

  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.08),_transparent_35%),linear-gradient(180deg,_rgba(248,250,252,1)_0%,_rgba(241,245,249,0.88)_100%)]">
      <div className="grid min-h-svh lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="relative overflow-hidden px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
          <div className="absolute inset-0 bg-[linear-gradient(145deg,_rgba(15,23,42,0.98)_0%,_rgba(30,41,59,0.94)_45%,_rgba(8,47,73,0.92)_100%)]" />
          <div className="absolute left-1/2 top-0 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-cyan-300/12 blur-3xl" />
          <div className="absolute -left-24 top-24 h-64 w-64 rounded-full bg-cyan-400/12 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-sky-300/8 blur-3xl" />
          <div className="absolute left-16 top-32 h-40 w-40 rounded-full border border-white/6 bg-white/4 blur-2xl" />

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white shadow-[0_12px_40px_rgba(15,23,42,0.28)] backdrop-blur-md">
                <LayoutDashboard className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium tracking-[0.24em] text-sky-100/70 uppercase">
                  Intelligent Perception Platform
                </p>
                <h1 className="text-xl font-semibold text-white">智能感知平台后台管理</h1>
              </div>
            </div>

            <div className="max-w-2xl space-y-8 py-12">
              <div className="space-y-4">
                <h2 className="max-w-xl text-4xl leading-tight font-semibold text-white sm:text-5xl">
                  用更清晰的视图管理用户、设备与系统状态。
                </h2>
                <p className="max-w-xl text-base leading-7 text-slate-200/82 sm:text-lg">
                  面向学生、教师、传感器和系统服务的统一后台入口，强调可读性、效率与稳定的日常运维体验。
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
          <div className="w-full max-w-md">
            <Card className="border-slate-200/80 bg-white/90 shadow-2xl shadow-slate-900/8 backdrop-blur-sm">
              <CardHeader className="space-y-3">
                <div className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                  欢迎登录
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-semibold tracking-tight text-slate-950">
                    登录系统
                  </CardTitle>
                  <CardDescription className="text-sm leading-6 text-slate-500">
                    输入统一身份账号与密码，进入综合后台管理平台。
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent>
                <form className="space-y-5" onSubmit={onSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="username">统一身份账号</Label>
                    <Input
                      id="username"
                      placeholder="请输入账号"
                      aria-invalid={errors.username ? true : undefined}
                      {...register("username", {
                        required: "请输入统一身份账号",
                      })}
                    />
                    {errors.username ? (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.username.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">密码</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={isPasswordVisible ? "text" : "password"}
                        placeholder="请输入密码"
                        className="pr-10"
                        aria-invalid={errors.password ? true : undefined}
                        {...register("password", {
                          required: "请输入登录密码",
                        })}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-slate-400 transition-colors hover:text-slate-600"
                        aria-label={isPasswordVisible ? "隐藏密码" : "显示密码"}
                        onClick={() => setIsPasswordVisible((value) => !value)}
                      >
                        {isPasswordVisible ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    {errors.password ? (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.password.message}
                      </p>
                    ) : null}
                  </div>

                  {submitError ? (
                    <div className="rounded-2xl border border-destructive/20 bg-destructive/6 px-4 py-3 text-sm leading-6 text-destructive">
                      {submitError}
                    </div>
                  ) : null}

                  <Button className="h-11 w-full text-sm" disabled={isSubmitting} type="submit">
                    {isSubmitting ? "登录中..." : "进入系统"}
                    <ArrowRight className="size-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
