import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();

    const entry = await prisma.vocabBookEntry.findFirst({
      where: { id: params.id, userId },
    });

    if (!entry) {
      return NextResponse.json({ error: "未找到该生词" }, { status: 404 });
    }

    await prisma.vocabBookEntry.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "已删除" });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    const body = await req.json();

    const entry = await prisma.vocabBookEntry.findFirst({
      where: { id: params.id, userId },
    });

    if (!entry) {
      return NextResponse.json({ error: "未找到该生词" }, { status: 404 });
    }

    const updated = await prisma.vocabBookEntry.update({
      where: { id: params.id },
      data: {
        ...(body.addedToReview !== undefined && {
          addedToReview: body.addedToReview,
          learnedAt: body.addedToReview ? new Date() : null,
        }),
        ...(body.color && { color: body.color }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
