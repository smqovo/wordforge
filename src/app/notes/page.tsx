"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { DaySidebar } from "@/components/DaySidebar";
import { WordCard } from "@/components/WordCard";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";

interface DayItem {
  id: string;
  dayNumber: number;
  theme: string;
  wordCount: number;
  learnedAt: string | null;
}

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
  dayNumber?: number;
  theme?: string;
  dayId?: string;
}

interface DayDetail {
  id: string;
  dayNumber: number;
  theme: string;
  learnedAt: string | null;
  words: WordItem[];
}

export default function NotesPage() {
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [days, setDays] = useState<DayItem[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [dayDetail, setDayDetail] = useState<DayDetail | null>(null);
  const [searchResults, setSearchResults] = useState<WordItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch days list
  const fetchDays = useCallback(async () => {
    try {
      const res = await fetch("/api/days");
      if (res.ok) {
        const data = await res.json();
        setDays(data);
        return data;
      }
    } catch (error) {
      console.error("Failed to fetch days:", error);
    }
    return [];
  }, []);

  // Fetch day detail
  const fetchDayDetail = useCallback(async (dayId: string) => {
    setLoading(true);
    setSearchResults(null);
    try {
      const res = await fetch(`/api/days/${dayId}/words`);
      if (res.ok) {
        const data = await res.json();
        setDayDetail(data);
      }
    } catch (error) {
      console.error("Failed to fetch day detail:", error);
    }
    setLoading(false);
  }, []);

  // Initialize
  useEffect(() => {
    fetchDays().then((data: DayItem[]) => {
      const dayParam = searchParams.get("day");
      if (dayParam && data.length > 0) {
        const targetDay = data.find(
          (d: DayItem) => d.dayNumber === parseInt(dayParam)
        );
        if (targetDay) {
          setSelectedDayId(targetDay.id);
          fetchDayDetail(targetDay.id);
        }
      } else if (data.length > 0) {
        setSelectedDayId(data[0].id);
        fetchDayDetail(data[0].id);
      }
    });
  }, [fetchDays, fetchDayDetail, searchParams]);

  // Select day
  const handleSelectDay = (dayId: string) => {
    setSelectedDayId(dayId);
    fetchDayDetail(dayId);
    setSidebarOpen(false);
  };

  // Search
  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults(null);
        return;
      }
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (error) {
        console.error("Search error:", error);
      }
    },
    []
  );

  // Upload
  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/notes/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadMessage(data.message);
        await fetchDays();
      } else {
        setUploadMessage(data.error || "上传失败");
      }
    } catch (_error) {
      setUploadMessage("上传失败，请检查网络");
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Mark as learned
  const handleMarkLearned = async () => {
    if (!selectedDayId) return;
    try {
      const res = await fetch(`/api/days/${selectedDayId}/learn`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchDays();
        await fetchDayDetail(selectedDayId);
      }
    } catch (error) {
      console.error("Failed to mark as learned:", error);
    }
  };

  const wordsToShow = searchResults ?? dayDetail?.words ?? [];

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Mobile sidebar toggle */}
      <button
        className="md:hidden fixed bottom-4 left-4 z-40 bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? "✕" : "☰"}
      </button>

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:relative z-30 w-64 h-full bg-white border-r transition-transform`}
      >
        <DaySidebar
          days={days}
          selectedDayId={selectedDayId}
          onSelectDay={handleSelectDay}
          onUpload={handleUpload}
        />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          {/* Upload message */}
          {uploadMessage && (
            <div className="mb-4 p-3 rounded-md bg-primary/10 text-primary text-sm">
              {uploadMessage}
              <button
                className="ml-2 text-xs underline"
                onClick={() => setUploadMessage("")}
              >
                关闭
              </button>
            </div>
          )}

          {uploading && (
            <div className="mb-4 p-3 rounded-md bg-muted text-sm">
              正在上传和解析笔记...
            </div>
          )}

          {/* Search bar */}
          <div className="mb-6">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Search results header */}
          {searchResults !== null && (
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                找到 {searchResults.length} 个结果
              </p>
              <button
                className="text-sm text-primary hover:underline"
                onClick={() => setSearchResults(null)}
              >
                清除搜索
              </button>
            </div>
          )}

          {/* Day header */}
          {!searchResults && dayDetail && (
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  Day {dayDetail.dayNumber} — {dayDetail.theme}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {dayDetail.words.length} 个单词
                  {dayDetail.learnedAt && (
                    <span className="ml-2 text-green-600">
                      ✓ 已学习于{" "}
                      {new Date(dayDetail.learnedAt).toLocaleDateString("zh-CN")}
                    </span>
                  )}
                </p>
              </div>
              {!dayDetail.learnedAt && (
                <Button onClick={handleMarkLearned} size="sm">
                  标记已学习
                </Button>
              )}
            </div>
          )}

          {/* Word cards */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border p-5 animate-pulse"
                >
                  <div className="h-6 bg-muted rounded w-1/4 mb-3" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : wordsToShow.length > 0 ? (
            <div className="space-y-4">
              {wordsToShow.map((word) => (
                <WordCard
                  key={word.id}
                  word={word.word}
                  phonetic={word.phonetic}
                  partOfSpeech={word.partOfSpeech}
                  definition={word.definition}
                  etymology={word.etymology}
                  associations={word.associations}
                  collocations={word.collocations}
                  supplements={word.supplements}
                  isCommonWord={word.isCommonWord}
                  dayNumber={
                    searchResults ? word.dayNumber : undefined
                  }
                  theme={searchResults ? word.theme : undefined}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              {days.length === 0
                ? "请先上传 Markdown 笔记文件"
                : "选择左侧天数查看单词"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
