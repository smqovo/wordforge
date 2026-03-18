import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function GET() {
  try {
    const userId = await requireUserId();

    const days = await prisma.day.findMany({
      where: { userId },
      include: {
        _count: { select: { words: true } },
      },
      orderBy: { dayNumber: "asc" },
    });

    return NextResponse.json(
      days.map((day) => ({
        id: day.id,
        dayNumber: day.dayNumber,
        theme: day.theme,
        wordCount: day._count.words,
        learnedAt: day.learnedAt,
      }))
    );
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
