"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { FlipCard } from "@/components/FlipCard";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface WordItem {
  id: string;
  word: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  definition: string;
  etymology: string | null;
  associations: string | null;
  collocations: string | null;
  supplements: string | null;
  isCommonWord: boolean;
}

interface DayDetail {
  id: string;
  dayNumber: number;
  theme: string;
  words: WordItem[];
}

type Phase = "words" | "collocations" | "associations" | "summary";

interface CollocationCard {
  wordId: string;
  word: string;
  collocation: string;
  meaning: string;
}

export default function ReviewDayPage() {
  const params = useParams();
  const router = useRouter();
  const dayId = params.dayId as string;

  const [dayDetail, setDayDetail] = useState<DayDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("words");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mastered, setMastered] = useState<Set<string>>(new Set());
  const [needWork, setNeedWork] = useState<Set<string>>(new Set());
  const [startTime] = useState(Date.now());

  // Phase B: collocation cards
  const collocationCards = useMemo(() => {
    if (!dayDetail) return [];
    const cards: CollocationCard[] = [];
    for (const w of dayDetail.words) {
      if (w.collocations) {
        const parts = w.collocations.split(/[;；]/).map((s) => s.trim()).filter(Boolean);
        for (const part of parts) {
          // Try to split "english 中文"
          const match = part.match(/^(.+?)\s+([\u4e00-\u9fff].*)$/);
          if (match) {
            cards.push({
              wordId: w.id,
              word: w.word,
              collocation: match[1].trim(),
              meaning: match[2].trim(),
            });
          } else {
            cards.push({
              wordId: w.id,
              word: w.word,
              collocation: part,
              meaning: "",
            });
          }
        }
      }
    }
    return cards;
  }, [dayDetail]);

  // Phase C: association cards
  const associationCards = useMemo(() => {
    if (!dayDetail) return [];
    return dayDetail.words.filter((w) => w.associations);
  }, [dayDetail]);

  useEffect(() => {
    async function fetchDay() {
      try {
        const res = await fetch(`/api/days/${dayId}/words`);
        if (res.ok) {
          setDayDetail(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch:", error);
      }
      setLoading(false);
    }
    fetchDay();
  }, [dayId]);

  const currentCards = useMemo(() => {
    if (!dayDetail) return [];
    if (phase === "words") return dayDetail.words;
    if (phase === "collocations") return collocationCards;
    if (phase === "associations") return associationCards;
    return [];
  }, [phase, dayDetail, collocationCards, associationCards]);

  const handleMastered = () => {
    const card = currentCards[currentIndex];
    const id = phase === "collocations"
      ? `col-${currentIndex}`
      : (card as WordItem).id || `assoc-${currentIndex}`;
    setMastered((prev) => new Set(prev).add(id));
    advanceCard();
  };

  const handleNeedWork = () => {
    const card = currentCards[currentIndex];
    const id = phase === "collocations"
      ? `col-${currentIndex}`
      : (card as WordItem).id || `assoc-${currentIndex}`;
    setNeedWork((prev) => new Set(prev).add(id));
    advanceCard();
  };

  const advanceCard = () => {
    if (currentIndex < currentCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Phase complete, move to next phase
      if (phase === "words") {
        if (collocationCards.length > 0) {
          setPhase("collocations");
          setCurrentIndex(0);
        } else if (associationCards.length > 0) {
          setPhase("associations");
          setCurrentIndex(0);
        } else {
          setPhase("summary");
        }
      } else if (phase === "collocations") {
        if (associationCards.length > 0) {
          setPhase("associations");
          setCurrentIndex(0);
        } else {
          setPhase("summary");
        }
      } else {
        setPhase("summary");
      }
    }
  };

  const handleComplete = async () => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    try {
      await fetch("/api/review/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayId,
          round: 1, // Simplified - should be calculated from review schedule
          cardStats: {
            mastered: Array.from(mastered),
            needWork: Array.from(needWork),
          },
          duration,
        }),
      });
    } catch (error) {
      console.error("Failed to save review:", error);
    }
    router.push("/review");
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!dayDetail) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">未找到该天数据</p>
      </div>
    );
  }

  // Summary phase
  if (phase === "summary") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">复习完成！</h2>
          <p className="text-muted-foreground mb-6">
            Day {dayDetail.dayNumber} — {dayDetail.theme}
          </p>
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {mastered.size}
              </p>
              <p className="text-sm text-muted-foreground">已掌握</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">
                {needWork.size}
              </p>
              <p className="text-sm text-muted-foreground">需加强</p>
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <Link href={`/quiz/${dayId}`}>
              <Button>进入 AI 测验</Button>
            </Link>
            <Button variant="outline" onClick={handleComplete}>
              完成复习
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const phaseLabels = {
    words: "轮次 A — 单词释义",
    collocations: "轮次 B — 词组搭配",
    associations: "轮次 C — 派生词/近义词",
  };

  const card = currentCards[currentIndex];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-semibold">
            Day {dayDetail.dayNumber} — {dayDetail.theme}
          </h1>
          <Badge variant="secondary">{phaseLabels[phase]}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Progress
            value={((currentIndex + 1) / currentCards.length) * 100}
            className="flex-1 h-2"
          />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {currentIndex + 1}/{currentCards.length}
          </span>
        </div>
      </div>

      {/* Flip Card */}
      {phase === "words" && (
        <FlipCard
          key={`word-${currentIndex}`}
          front={
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">
                {(card as WordItem).word}
              </h2>
              {(card as WordItem).phonetic && (
                <p className="text-muted-foreground mb-2">
                  {(card as WordItem).phonetic}
                </p>
              )}
              {(card as WordItem).partOfSpeech && (
                <Badge variant="secondary">
                  {(card as WordItem).partOfSpeech}
                </Badge>
              )}
              {(card as WordItem).isCommonWord && (
                <p className="mt-3 text-sm text-amber-600">
                  ⚠️ 注意僻义
                </p>
              )}
            </div>
          }
          back={
            <div className="text-center">
              <p className="text-lg mb-4">
                {(card as WordItem).definition}
              </p>
              {(card as WordItem).etymology && (
                <div className="text-sm text-blue-700 bg-blue-50 rounded-lg p-3 mt-2">
                  <span className="font-semibold">【拆】</span>
                  {(card as WordItem).etymology}
                </div>
              )}
            </div>
          }
          onMastered={handleMastered}
          onNeedWork={handleNeedWork}
        />
      )}

      {phase === "collocations" && (
        <FlipCard
          key={`col-${currentIndex}`}
          front={
            <div className="text-center">
              <h2 className="text-2xl font-bold">
                {(card as CollocationCard).collocation}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                ({(card as CollocationCard).word})
              </p>
            </div>
          }
          back={
            <div className="text-center">
              <p className="text-lg">
                {(card as CollocationCard).meaning || (card as CollocationCard).collocation}
              </p>
            </div>
          }
          onMastered={handleMastered}
          onNeedWork={handleNeedWork}
        />
      )}

      {phase === "associations" && (
        <FlipCard
          key={`assoc-${currentIndex}`}
          front={
            <div className="text-center">
              <h2 className="text-3xl font-bold">
                {(card as WordItem).word}
              </h2>
            </div>
          }
          back={
            <div className="text-center">
              <div className="text-sm text-green-700 bg-green-50 rounded-lg p-4">
                <span className="font-semibold">【记】</span>
                <span className="whitespace-pre-wrap">
                  {(card as WordItem).associations}
                </span>
              </div>
            </div>
          }
          onMastered={handleMastered}
          onNeedWork={handleNeedWork}
        />
      )}
    </div>
  );
}
