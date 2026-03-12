import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ModulePlaceholderPageProps {
  title: string
  description: string
}

export function ModulePlaceholderPage({
  title,
  description,
}: ModulePlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>模块框架已就位</CardTitle>
          <CardDescription>
            当前已完成后台整体壳子与路由挂载，下一步可以继续细化这个模块的业务页。
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          这里暂时作为占位页保留，避免后台菜单进入空白状态。后续我们可以继续实现传感器监控图表、服务状态列表、告警视图等内容。
        </CardContent>
      </Card>
    </div>
  )
}
