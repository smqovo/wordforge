"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ReviewItem {
  dayId: string;
  dayNumber: number;
  theme: string;
  round: number;
  scheduledDate: string;
  isOverdue: boolean;
  overdueDays: number;
}

export default function ReviewPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch("/api/review/today");
        if (res.ok) {
          const data = await res.json();
          setReviews(data);
        }
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      }
      setLoading(false);
    }
    fetchReviews();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-2">复习计划</h1>
      <p className="text-muted-foreground mb-6">
        基于艾宾浩斯遗忘曲线，在最佳时间点复习已学内容
      </p>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border p-5 animate-pulse">
              <div className="h-6 bg-muted rounded w-1/3 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card
              key={`${review.dayId}-${review.round}`}
              className={
                review.isOverdue
                  ? "border-red-300 bg-red-50"
                  : "border-orange-200 bg-orange-50"
              }
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      Day {review.dayNumber} — {review.theme}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className={
                          review.isOverdue
                            ? "bg-red-200 text-red-800"
                            : "bg-orange-200 text-orange-800"
                        }
                      >
                        第 {review.round} 轮复习
                      </Badge>
                      {review.isOverdue && (
                        <span className="text-sm text-red-600">
                          已逾期 {review.overdueDays} 天
                        </span>
                      )}
                    </div>
                  </div>
                  <Link href={`/review/${review.dayId}`}>
                    <Button
                      variant={review.isOverdue ? "destructive" : "default"}
                    >
                      开始复习
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              暂无待复习内容
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              在「笔记浏览」页标记已学习的天数后，系统会自动安排复习计划
            </p>
            <Link href="/notes">
              <Button variant="outline">去浏览笔记</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Ebbinghaus explanation */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-medium mb-2">艾宾浩斯复习间隔</h3>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 4, 7, 15, 30].map((days, i) => (
            <span
              key={days}
              className="text-sm bg-white px-3 py-1 rounded-full border"
            >
              第{i + 1}轮：{days}天后
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
