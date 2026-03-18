import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { dayId, round, cardStats, duration } = await req.json();

    if (!dayId || !round || !cardStats) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // Verify the day belongs to this user
    const day = await prisma.day.findFirst({
      where: { id: dayId, userId },
    });

    if (!day) {
      return NextResponse.json({ error: "未找到该天数据" }, { status: 404 });
    }

    const reviewLog = await prisma.reviewLog.create({
      data: {
        dayId,
        userId,
        round,
        reviewDate: new Date(),
        cardStats,
        duration,
      },
    });

    return NextResponse.json({
      message: "复习记录已保存",
      reviewLogId: reviewLog.id,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
