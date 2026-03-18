"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClozeBlank {
  number: number;
  options: string[];
  answer: string;
  explanation: string;
  relatedWord: string;
}

interface ClozeQuiz {
  passage: string;
  blanks: ClozeBlank[];
}

interface ReadingQuestion {
  number: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface ReadingQuiz {
  passage: string;
  questions: ReadingQuestion[];
}

interface DayInfo {
  dayNumber: number;
  theme: string;
}

export default function QuizPage() {
  const params = useParams();
  const dayId = params.dayId as string;

  const [dayInfo, setDayInfo] = useState<DayInfo | null>(null);
  const [clozeQuiz, setClozeQuiz] = useState<ClozeQuiz | null>(null);
  const [readingQuiz, setReadingQuiz] = useState<ReadingQuiz | null>(null);
  const [clozeAnswers, setClozeAnswers] = useState<Record<number, string>>({});
  const [readingAnswers, setReadingAnswers] = useState<Record<number, string>>({});
  const [clozeSubmitted, setClozeSubmitted] = useState(false);
  const [readingSubmitted, setReadingSubmitted] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/days/${dayId}/words`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) setDayInfo({ dayNumber: data.dayNumber, theme: data.theme });
      })
      .catch(() => {});
  }, [dayId]);

  const generateQuiz = async (type: "cloze" | "reading") => {
    setGenerating(type);
    setError("");
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dayId, type }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "生成失败");
        setGenerating(null);
        return;
      }
      if (type === "cloze") {
        setClozeQuiz(data);
        setClozeAnswers({});
        setClozeSubmitted(false);
      } else {
        setReadingQuiz(data);
        setReadingAnswers({});
        setReadingSubmitted(false);
      }
    } catch {
      setError("生成失败，请检查网络");
    }
    setGenerating(null);
  };

  const submitCloze = async () => {
    setClozeSubmitted(true);
    if (!clozeQuiz) return;
    const correct = clozeQuiz.blanks.filter(
      (b) => clozeAnswers[b.number] === b.answer
    ).length;
    try {
      await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayId,
          type: "cloze",
          score: correct,
          total: clozeQuiz.blanks.length,
        }),
      });
    } catch {}
  };

  const submitReading = async () => {
    setReadingSubmitted(true);
    if (!readingQuiz) return;
    const correct = readingQuiz.questions.filter(
      (q) => readingAnswers[q.number] === q.answer
    ).length;
    try {
      await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayId,
          type: "reading",
          score: correct,
          total: readingQuiz.questions.length,
        }),
      });
    } catch {}
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-1">
        {dayInfo
          ? `Day ${dayInfo.dayNumber} 测验 — ${dayInfo.theme}`
          : "AI 测验"}
      </h1>
      <p className="text-muted-foreground mb-6">
        AI 生成的完形填空和阅读理解练习
      </p>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      <Tabs defaultValue="cloze">
        <TabsList className="mb-6">
          <TabsTrigger value="cloze">完形填空</TabsTrigger>
          <TabsTrigger value="reading">阅读理解</TabsTrigger>
        </TabsList>

        <TabsContent value="cloze">
          {!clozeQuiz ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  点击下方按钮生成完形填空题目
                </p>
                <Button
                  onClick={() => generateQuiz("cloze")}
                  disabled={generating !== null}
                >
                  {generating === "cloze" ? "生成中..." : "生成题目"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Passage */}
              <Card>
                <CardContent className="p-6">
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {clozeQuiz.passage}
                  </p>
                </CardContent>
              </Card>

              {/* Questions */}
              {clozeQuiz.blanks.map((blank) => {
                const isCorrect = clozeAnswers[blank.number] === blank.answer;
                return (
                  <Card
                    key={blank.number}
                    className={
                      clozeSubmitted
                        ? isCorrect
                          ? "border-green-300"
                          : "border-red-300"
                        : ""
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary">
                          第 {blank.number} 题
                        </Badge>
                        {clozeSubmitted && (
                          <span>{isCorrect ? "✅" : "❌"}</span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {blank.options.map((opt) => {
                          const letter = opt.charAt(0);
                          return (
                            <label
                              key={opt}
                              className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                                clozeAnswers[blank.number] === letter
                                  ? "bg-primary/10 border-primary"
                                  : "hover:bg-muted"
                              } ${
                                clozeSubmitted && letter === blank.answer
                                  ? "bg-green-100 border-green-400"
                                  : ""
                              }`}
                            >
                              <input
                                type="radio"
                                name={`cloze-${blank.number}`}
                                value={letter}
                                checked={
                                  clozeAnswers[blank.number] === letter
                                }
                                onChange={() =>
                                  !clozeSubmitted &&
                                  setClozeAnswers({
                                    ...clozeAnswers,
                                    [blank.number]: letter,
                                  })
                                }
                                disabled={clozeSubmitted}
                                className="shrink-0"
                              />
                              <span className="text-sm">{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                      {clozeSubmitted && !isCorrect && (
                        <div className="mt-3 text-sm bg-muted p-3 rounded-md">
                          <p className="font-medium">
                            正确答案：{blank.answer}
                          </p>
                          <p className="text-muted-foreground mt-1">
                            {blank.explanation}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              <div className="flex gap-4">
                {!clozeSubmitted ? (
                  <Button onClick={submitCloze}>提交答案</Button>
                ) : (
                  <>
                    <div className="text-lg font-semibold">
                      得分：
                      {
                        clozeQuiz.blanks.filter(
                          (b) => clozeAnswers[b.number] === b.answer
                        ).length
                      }
                      /{clozeQuiz.blanks.length}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => generateQuiz("cloze")}
                      disabled={generating !== null}
                    >
                      重新生成
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reading">
          {!readingQuiz ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  点击下方按钮生成阅读理解题目
                </p>
                <Button
                  onClick={() => generateQuiz("reading")}
                  disabled={generating !== null}
                >
                  {generating === "reading" ? "生成中..." : "生成题目"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Passage */}
              <Card>
                <CardContent className="p-6">
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {readingQuiz.passage}
                  </p>
                </CardContent>
              </Card>

              {/* Questions */}
              {readingQuiz.questions.map((q) => {
                const isCorrect = readingAnswers[q.number] === q.answer;
                return (
                  <Card
                    key={q.number}
                    className={
                      readingSubmitted
                        ? isCorrect
                          ? "border-green-300"
                          : "border-red-300"
                        : ""
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">
                          第 {q.number} 题
                        </Badge>
                        {readingSubmitted && (
                          <span>{isCorrect ? "✅" : "❌"}</span>
                        )}
                      </div>
                      <p className="font-medium mb-3">{q.question}</p>
                      <div className="space-y-2">
                        {q.options.map((opt) => {
                          const letter = opt.charAt(0);
                          return (
                            <label
                              key={opt}
                              className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                                readingAnswers[q.number] === letter
                                  ? "bg-primary/10 border-primary"
                                  : "hover:bg-muted"
                              } ${
                                readingSubmitted && letter === q.answer
                                  ? "bg-green-100 border-green-400"
                                  : ""
                              }`}
                            >
                              <input
                                type="radio"
                                name={`reading-${q.number}`}
                                value={letter}
                                checked={readingAnswers[q.number] === letter}
                                onChange={() =>
                                  !readingSubmitted &&
                                  setReadingAnswers({
                                    ...readingAnswers,
                                    [q.number]: letter,
                                  })
                                }
                                disabled={readingSubmitted}
                                className="shrink-0"
                              />
                              <span className="text-sm">{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                      {readingSubmitted && !isCorrect && (
                        <div className="mt-3 text-sm bg-muted p-3 rounded-md">
                          <p className="font-medium">
                            正确答案：{q.answer}
                          </p>
                          <p className="text-muted-foreground mt-1">
                            {q.explanation}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              <div className="flex gap-4">
                {!readingSubmitted ? (
                  <Button onClick={submitReading}>提交答案</Button>
                ) : (
                  <>
                    <div className="text-lg font-semibold">
                      得分：
                      {
                        readingQuiz.questions.filter(
                          (q) => readingAnswers[q.number] === q.answer
                        ).length
                      }
                      /{readingQuiz.questions.length}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => generateQuiz("reading")}
                      disabled={generating !== null}
                    >
                      重新生成
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
