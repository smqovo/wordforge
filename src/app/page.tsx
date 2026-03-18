"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ReviewItem {
  dayId: string;
  dayNumber: number;
  theme: string;
  round: number;
}

interface DayItem {
  id: string;
  dayNumber: number;
  learnedAt: string | null;
  wordCount: number;
}

export default function Home() {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [days, setDays] = useState<DayItem[]>([]);

  useEffect(() => {
    if (!session) return;
    fetch("/api/review/today")
      .then((r) => r.ok ? r.json() : [])
      .then(setReviews)
      .catch(() => {});
    fetch("/api/days")
      .then((r) => r.ok ? r.json() : [])
      .then(setDays)
      .catch(() => {});
  }, [session]);

  const learnedDays = days.filter((d) => d.learnedAt);
  const totalWords = days.reduce((sum, d) => sum + d.wordCount, 0);

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">WordForge</h1>
        <p className="text-xl text-muted-foreground mb-2">
          雅思单词智能复习系统
        </p>
        <p className="text-muted-foreground mb-8">
          基于艾宾浩斯遗忘曲线，结合 AI 测验，高效记忆雅思词汇
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button variant="outline" size="lg">登录</Button>
          </Link>
          <Link href="/register">
            <Button size="lg">免费注册</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Today's Review Card */}
      <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="text-lg">今日复习</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary mb-2">
            {reviews.length} 个章节
          </p>
          <p className="text-muted-foreground mb-4">
            {reviews.length > 0
              ? `待复习：${reviews.map((r) => `Day ${r.dayNumber}`).join("、")}`
              : "暂无待复习内容"}
          </p>
          <Link href="/review">
            <Button>查看复习计划</Button>
          </Link>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              学习进度
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {learnedDays.length} / {days.length}
            </p>
            <p className="text-xs text-muted-foreground">
              已学习天数 / 总天数
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总单词数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalWords}</p>
            <p className="text-xs text-muted-foreground">已导入单词</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              待复习
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{reviews.length} 章</p>
            <p className="text-xs text-muted-foreground">
              今日待复习章节
            </p>
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
              <p className="text-sm text-muted-foreground">
                查看和搜索你的单词笔记
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/review">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <h3 className="font-semibold mb-1">🔄 开始复习</h3>
              <p className="text-sm text-muted-foreground">
                翻转卡片复习 + AI 测验
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
