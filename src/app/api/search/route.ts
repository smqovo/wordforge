import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const q = req.nextUrl.searchParams.get("q");

    if (!q || q.trim().length === 0) {
      return NextResponse.json([]);
    }

    const query = q.trim();

    const words = await prisma.word.findMany({
      where: {
        day: { userId },
        OR: [
          { word: { contains: query, mode: "insensitive" } },
          { definition: { contains: query, mode: "insensitive" } },
          { collocations: { contains: query, mode: "insensitive" } },
          { associations: { contains: query, mode: "insensitive" } },
          { etymology: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        day: { select: { dayNumber: true, theme: true } },
      },
      orderBy: { day: { dayNumber: "asc" } },
      take: 50,
    });

    return NextResponse.json(
      words.map((w) => ({
        id: w.id,
        word: w.word,
        phonetic: w.phonetic,
        partOfSpeech: w.partOfSpeech,
        definition: w.definition,
        etymology: w.etymology,
        associations: w.associations,
        collocations: w.collocations,
        supplements: w.supplements,
        isCommonWord: w.isCommonWord,
        dayNumber: w.day.dayNumber,
        theme: w.day.theme,
        dayId: w.dayId,
      }))
    );
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "搜索失败" }, { status: 500 });
  }
}
