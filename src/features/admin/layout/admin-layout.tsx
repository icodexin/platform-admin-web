import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ActivitySquare,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MoonStar,
  ServerCog,
  SunMedium,
  UsersRound,
} from "lucide-react"
import { useMemo } from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"

import { authApi } from "@/api"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { clearStoredAuthTokens, getRefreshToken } from "@/lib/auth/token-storage"
import { useAuthStore } from "@/stores/auth-store"
import { useThemeStore } from "@/stores/theme-store"
import type { User } from "@/types/users"

const menuItems = [
  {
    title: "用户管理",
    href: "/admin/users",
    icon: UsersRound,
  },
  {
    title: "传感器监控",
    href: "/admin/sensors",
    icon: ActivitySquare,
  },
  {
    title: "服务管理",
    href: "/admin/services",
    icon: ServerCog,
  },
]

const pageTitleMap: Record<string, { title: string; description: string }> = {
  "/admin/users": {
    title: "用户管理",
    description: "集中处理学生、教师与管理员的账号数据与状态。",
  },
  "/admin/sensors": {
    title: "传感器监控",
    description: "查看实时感知设备状态、指标与异常趋势。",
  },
  "/admin/services": {
    title: "服务管理",
    description: "监控系统服务运行情况与运维处理状态。",
  },
}

function getUserInitials(user: User | null) {
  if (!user?.name) {
    return "IP"
  }

  return user.name.slice(0, 2)
}

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.currentUser)
  const clearAuthState = useAuthStore((state) => state.clearAuthState)
  const theme = useThemeStore((state) => state.theme)
  const toggleTheme = useThemeStore((state) => state.toggleTheme)

  const pageMeta = useMemo(() => {
    return (
      pageTitleMap[location.pathname] ?? {
        title: "后台管理",
        description: "统一管理平台内的用户、设备与系统模块。",
      }
    )
  }, [location.pathname])

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = getRefreshToken()

      if (refreshToken) {
        await authApi.logout({
          refresh_token: refreshToken,
        })
      }
    },
    onSettled: async () => {
      clearStoredAuthTokens()
      clearAuthState()
      await queryClient.clear()
      navigate("/login", { replace: true })
    },
  })

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader className="px-2 py-4">
          <div className="flex items-center gap-3 rounded-2xl border border-sidebar-border/80 bg-sidebar-accent/45 px-3 py-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground">
              <LayoutDashboard className="size-5" />
            </div>
            <div className="min-w-0 transition-opacity group-data-[collapsible=icon]:hidden">
              <div className="truncate text-sm font-semibold">智能感知平台</div>
              <div className="truncate text-xs text-sidebar-foreground/65">
                后台管理控制台
              </div>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>业务模块</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={location.pathname === item.href}
                    >
                      <NavLink to={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter className="px-2 py-4">
          <div className="rounded-2xl border border-sidebar-border/80 bg-sidebar-accent/45 px-3 py-3 group-data-[collapsible=icon]:hidden">
            <p className="text-xs uppercase tracking-[0.18em] text-sidebar-foreground/55">
              Workspace
            </p>
            <p className="mt-2 text-sm font-medium">智能感知实验室</p>
            <p className="mt-1 text-xs leading-5 text-sidebar-foreground/65">
              用户、设备与系统状态统一从这里收口管理。
            </p>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.06),_transparent_24%),linear-gradient(180deg,_rgba(248,250,252,1)_0%,_rgba(241,245,249,0.9)_100%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_24%),linear-gradient(180deg,_rgba(2,6,23,1)_0%,_rgba(15,23,42,0.96)_100%)]">
        <header className="sticky top-0 z-20 border-b bg-background/82 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Admin Console
                </div>
                <div className="text-lg font-semibold">{pageMeta.title}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={toggleTheme}
              >
                {theme === "dark" ? (
                  <SunMedium className="size-4" />
                ) : (
                  <MoonStar className="size-4" />
                )}
                <span className="sr-only">切换主题</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-11 gap-3 rounded-full px-3">
                    <Avatar size="default">
                      <AvatarFallback>{getUserInitials(currentUser)}</AvatarFallback>
                    </Avatar>
                    <div className="hidden text-left sm:block">
                      <div className="text-sm font-medium">{currentUser?.name ?? "当前用户"}</div>
                      <div className="text-xs text-muted-foreground">
                        {currentUser?.roles.join(" / ") || "未加载角色"}
                      </div>
                    </div>
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="space-y-1">
                    <div className="font-medium">{currentUser?.name ?? "当前用户"}</div>
                    <div className="text-xs text-muted-foreground">
                      {currentUser?.unified_id ?? "未登录"}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5">
                    <Badge variant="secondary">{currentUser?.user_type ?? "guest"}</Badge>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={logoutMutation.isPending}
                    onClick={() => logoutMutation.mutate()}
                  >
                    <LogOut />
                    <span>{logoutMutation.isPending ? "退出中..." : "退出登录"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col px-5 py-6 sm:px-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">{pageMeta.title}</h1>
              <p className="text-sm text-muted-foreground">{pageMeta.description}</p>
            </div>
          </div>

          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
