import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { dayId, type, score, total } = await req.json();

    // Update the latest review log for this day with quiz score
    const latestReview = await prisma.reviewLog.findFirst({
      where: { dayId, userId },
      orderBy: { createdAt: "desc" },
    });

    if (latestReview) {
      const existingScore = (latestReview.quizScore as Record<string, unknown>) || {};
      await prisma.reviewLog.update({
        where: { id: latestReview.id },
        data: {
          quizScore: {
            ...existingScore,
            [type]: { score, total },
          },
        },
      });
    }

    return NextResponse.json({ message: "测验结果已保存" });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
