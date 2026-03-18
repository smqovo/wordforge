import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();

    const day = await prisma.day.findFirst({
      where: { id: params.id, userId },
      include: {
        words: { orderBy: { orderIndex: "asc" } },
      },
    });

    if (!day) {
      return NextResponse.json({ error: "未找到该天数据" }, { status: 404 });
    }

    return NextResponse.json({
      id: day.id,
      dayNumber: day.dayNumber,
      theme: day.theme,
      learnedAt: day.learnedAt,
      words: day.words,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
