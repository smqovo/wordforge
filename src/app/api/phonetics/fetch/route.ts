import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { fetchPhoneticsForWords } from "@/lib/phonetics";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { dayId } = await req.json();

    if (!dayId) {
      return NextResponse.json({ error: "缺少 dayId" }, { status: 400 });
    }

    const day = await prisma.day.findFirst({
      where: { id: dayId, userId },
      include: {
        words: {
          where: { phonetic: null },
          select: { id: true, word: true },
        },
      },
    });

    if (!day) {
      return NextResponse.json({ error: "未找到该天数据" }, { status: 404 });
    }

    if (day.words.length === 0) {
      return NextResponse.json({ message: "所有单词已有音标", updated: 0 });
    }

    const results = await fetchPhoneticsForWords(day.words);

    let updated = 0;
    for (const { id, phonetic } of results) {
      if (phonetic) {
        await prisma.word.update({
          where: { id },
          data: { phonetic },
        });
        updated++;
      }
    }

    return NextResponse.json({
      message: `已更新 ${updated} 个单词的音标`,
      updated,
      total: day.words.length,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    console.error("Phonetics fetch error:", error);
    return NextResponse.json({ error: "获取音标失败" }, { status: 500 });
  }
}
