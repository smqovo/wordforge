import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">WordForge</span>
              <span className="text-sm text-muted-foreground">雅思单词智能复习</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/notes" className="text-sm font-medium hover:text-primary transition-colors">
                笔记浏览
              </Link>
              <Link href="/review" className="text-sm font-medium hover:text-primary transition-colors">
                复习计划
              </Link>
              <Link href="/vocab" className="text-sm font-medium hover:text-primary transition-colors">
                生词本
              </Link>
              <Link href="/settings" className="text-sm font-medium hover:text-primary transition-colors">
                设置
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm">登录</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">注册</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Today's Review Card */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="text-lg">今日复习</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary mb-2">0 个章节</p>
            <p className="text-muted-foreground mb-4">暂无待复习内容，请先导入笔记并标记学习进度</p>
            <Link href="/review">
              <Button>查看复习计划</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">学习进度</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0 / 0</p>
              <p className="text-xs text-muted-foreground">已学习天数 / 总天数</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">单词掌握</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-muted-foreground">已掌握单词数</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">连续学习</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">0 天</p>
              <p className="text-xs text-muted-foreground">连续学习天数</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-semibold mb-4">快速开始</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/notes">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <h3 className="font-semibold mb-1">📚 浏览笔记</h3>
                <p className="text-sm text-muted-foreground">查看和搜索你的单词笔记</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/notes">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <h3 className="font-semibold mb-1">📝 导入笔记</h3>
                <p className="text-sm text-muted-foreground">上传 Markdown 格式的学习笔记</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  );
}
