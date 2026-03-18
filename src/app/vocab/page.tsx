"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VocabEntry {
  id: string;
  word: string;
  definition: string | null;
  color: string;
  source: string | null;
  addedToReview: boolean;
  learnedAt: string | null;
  createdAt: string;
}

const colorMap: Record<string, { bg: string; label: string }> = {
  yellow: { bg: "bg-mark-yellow", label: "黄色" },
  red: { bg: "bg-mark-red", label: "红色" },
  green: { bg: "bg-mark-green", label: "绿色" },
  blue: { bg: "bg-mark-blue", label: "蓝色" },
};

export default function VocabPage() {
  const [entries, setEntries] = useState<VocabEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterColor, setFilterColor] = useState<string | null>(null);

  const fetchEntries = async () => {
    try {
      const res = await fetch("/api/vocab");
      if (res.ok) setEntries(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/vocab/${id}`, { method: "DELETE" });
      if (res.ok) setEntries(entries.filter((e) => e.id !== id));
    } catch {}
  };

  const handleToggleReview = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/vocab/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addedToReview: !current }),
      });
      if (res.ok) {
        const updated = await res.json();
        setEntries(entries.map((e) => (e.id === id ? updated : e)));
      }
    } catch {}
  };

  const filtered = filterColor
    ? entries.filter((e) => e.color === filterColor)
    : entries;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">生词本</h1>
          <p className="text-muted-foreground">
            共 {entries.length} 个生词
          </p>
        </div>
      </div>

      {/* Color filter */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilterColor(null)}
          className={`px-3 py-1 text-sm rounded-full border transition-colors ${
            !filterColor ? "bg-foreground text-background" : "hover:bg-muted"
          }`}
        >
          全部
        </button>
        {Object.entries(colorMap).map(([key, { bg, label }]) => (
          <button
            key={key}
            onClick={() => setFilterColor(filterColor === key ? null : key)}
            className={`px-3 py-1 text-sm rounded-full border transition-colors flex items-center gap-1 ${
              filterColor === key ? "ring-2 ring-primary" : "hover:bg-muted"
            }`}
          >
            <span className={`w-3 h-3 rounded-full ${bg}`} />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
              <div className="h-5 bg-muted rounded w-1/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-4 h-4 rounded-full shrink-0 ${
                        colorMap[entry.color]?.bg || "bg-gray-200"
                      }`}
                    />
                    <div>
                      <span className="font-semibold">{entry.word}</span>
                      {entry.definition && (
                        <span className="text-muted-foreground ml-2 text-sm">
                          {entry.definition}
                        </span>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {entry.source && (
                          <Badge variant="secondary" className="text-xs">
                            {entry.source}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleDateString("zh-CN")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={entry.addedToReview ? "secondary" : "outline"}
                      size="sm"
                      onClick={() =>
                        handleToggleReview(entry.id, entry.addedToReview)
                      }
                    >
                      {entry.addedToReview ? "已加入复习" : "加入复习"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      删除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {filterColor
                ? "该颜色下暂无生词"
                : "暂无生词，在测验中选中单词即可添加"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
