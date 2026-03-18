import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { getTodayReviews } from "@/lib/review";

export async function GET() {
  try {
    const userId = await requireUserId();

    const days = await prisma.day.findMany({
      where: {
        userId,
        learnedAt: { not: null },
      },
      include: {
        _count: { select: { words: true, reviewLogs: true } },
        reviewLogs: { select: { id: true } },
      },
      orderBy: { dayNumber: "asc" },
    });

    const reviews = getTodayReviews(
      days.map((day) => ({
        id: day.id,
        dayNumber: day.dayNumber,
        theme: day.theme,
        learnedAt: day.learnedAt,
        completedRounds: day._count.reviewLogs,
      }))
    );

    return NextResponse.json(reviews);
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
