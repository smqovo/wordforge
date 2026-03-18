import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function GET() {
  try {
    const userId = await requireUserId();
    const entries = await prisma.vocabBookEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(entries);
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { word, definition, color, source } = await req.json();

    if (!word) {
      return NextResponse.json({ error: "单词不能为空" }, { status: 400 });
    }

    const entry = await prisma.vocabBookEntry.create({
      data: {
        userId,
        word,
        definition: definition || null,
        color: color || "yellow",
        source: source || null,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "添加失败" }, { status: 500 });
  }
}
