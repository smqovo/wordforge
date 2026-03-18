import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseMarkdown } from "@/lib/parser";
import { requireUserId } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "请选择文件" }, { status: 400 });
    }

    const content = await file.text();
    const parsedDays = parseMarkdown(content);

    if (parsedDays.length === 0) {
      return NextResponse.json(
        { error: "未能解析到任何内容，请检查文件格式" },
        { status: 400 }
      );
    }

    let newDays = 0;
    let updatedDays = 0;
    let totalWords = 0;

    for (const parsedDay of parsedDays) {
      // Check if this day already exists for this user
      const existingDay = await prisma.day.findUnique({
        where: {
          userId_dayNumber: {
            userId,
            dayNumber: parsedDay.dayNumber,
          },
        },
      });

      if (existingDay) {
        // Update existing day: delete old words and re-create
        await prisma.word.deleteMany({ where: { dayId: existingDay.id } });

        await prisma.day.update({
          where: { id: existingDay.id },
          data: { theme: parsedDay.theme },
        });

        await prisma.word.createMany({
          data: parsedDay.words.map((w, index) => ({
            dayId: existingDay.id,
            word: w.word,
            partOfSpeech: w.partOfSpeech,
            definition: w.definition,
            etymology: w.etymology,
            associations: w.associations,
            collocations: w.collocations,
            supplements: w.supplements,
            rawContent: w.rawContent,
            isCommonWord: w.isCommonWord,
            orderIndex: index,
          })),
        });

        updatedDays++;
        totalWords += parsedDay.words.length;
      } else {
        // Create new day with words
        await prisma.day.create({
          data: {
            userId,
            dayNumber: parsedDay.dayNumber,
            theme: parsedDay.theme,
            words: {
              create: parsedDay.words.map((w, index) => ({
                word: w.word,
                partOfSpeech: w.partOfSpeech,
                definition: w.definition,
                etymology: w.etymology,
                associations: w.associations,
                collocations: w.collocations,
                supplements: w.supplements,
                rawContent: w.rawContent,
                isCommonWord: w.isCommonWord,
                orderIndex: index,
              })),
            },
          },
        });

        newDays++;
        totalWords += parsedDay.words.length;
      }
    }

    return NextResponse.json({
      message: `更新成功：新增 ${newDays} 天，更新 ${updatedDays} 天，共 ${totalWords} 个单词`,
      newDays,
      updatedDays,
      totalWords,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "上传失败，请稍后重试" },
      { status: 500 }
    );
  }
}
