import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { generateQuiz } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { dayId, type } = await req.json();

    if (!dayId || !type || !["cloze", "reading"].includes(type)) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    const day = await prisma.day.findFirst({
      where: { id: dayId, userId },
      include: { words: { orderBy: { orderIndex: "asc" } } },
    });

    if (!day) {
      return NextResponse.json({ error: "未找到该天数据" }, { status: 404 });
    }

    if (!process.env.CLAUDE_API_KEY) {
      return NextResponse.json(
        { error: "请先在设置中配置 AI API Key" },
        { status: 400 }
      );
    }

    const wordData = day.words.map((w) => ({
      word: w.word,
      definition: w.definition,
      collocations: w.collocations,
      isCommonWord: w.isCommonWord,
    }));

    const quiz = await generateQuiz(wordData, day.theme, type);

    return NextResponse.json(quiz);
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      { error: "生成测验失败，请稍后重试" },
      { status: 500 }
    );
  }
}
