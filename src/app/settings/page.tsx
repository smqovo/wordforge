"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">设置</h1>

      <div className="space-y-6">
        {/* Color meanings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">标记颜色含义</CardTitle>
            <CardDescription>
              自定义生词标记颜色的含义
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-mark-red" />
              <span className="text-sm">红色 — 完全不认识</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-mark-yellow" />
              <span className="text-sm">黄色 — 有点印象，不确定</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-mark-blue" />
              <span className="text-sm">蓝色 — 认识但不熟练</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-mark-green" />
              <span className="text-sm">绿色 — 已掌握，待巩固</span>
            </div>
          </CardContent>
        </Card>

        {/* AI API Key info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI 测验配置</CardTitle>
            <CardDescription>
              AI 测验功能需要配置 Claude API Key
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              API Key 需在服务端环境变量中配置（CLAUDE_API_KEY），出于安全考虑不在前端显示。
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              使用的模型：claude-sonnet-4-20250514
            </p>
          </CardContent>
        </Card>

        {/* Ebbinghaus intervals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">复习间隔</CardTitle>
            <CardDescription>
              基于艾宾浩斯遗忘曲线的复习时间安排
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[
                { round: 1, days: 1 },
                { round: 2, days: 2 },
                { round: 3, days: 4 },
                { round: 4, days: 7 },
                { round: 5, days: 15 },
                { round: 6, days: 30 },
              ].map(({ round, days }) => (
                <span
                  key={round}
                  className="text-sm bg-muted px-3 py-1.5 rounded-full"
                >
                  第{round}轮：学习后{days}天
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
