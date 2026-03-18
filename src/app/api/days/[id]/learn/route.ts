import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();

    const day = await prisma.day.findFirst({
      where: { id: params.id, userId },
    });

    if (!day) {
      return NextResponse.json({ error: "未找到该天数据" }, { status: 404 });
    }

    const updated = await prisma.day.update({
      where: { id: params.id },
      data: { learnedAt: new Date() },
    });

    return NextResponse.json({
      message: "已标记为已学习",
      learnedAt: updated.learnedAt,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
