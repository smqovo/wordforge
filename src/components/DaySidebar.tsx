"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface DayItem {
  id: string;
  dayNumber: number;
  theme: string;
  wordCount: number;
  learnedAt: string | null;
}

interface DaySidebarProps {
  days: DayItem[];
  selectedDayId: string | null;
  onSelectDay: (dayId: string) => void;
  onUpload: () => void;
}

export function DaySidebar({
  days,
  selectedDayId,
  onSelectDay,
  onUpload,
}: DaySidebarProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <button
          onClick={onUpload}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          📝 更新笔记
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {days.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            暂无笔记，请先上传
          </div>
        ) : (
          <ul className="py-2">
            {days.map((day) => (
              <li key={day.id}>
                <button
                  onClick={() => onSelectDay(day.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 text-sm transition-colors hover:bg-accent",
                    selectedDayId === day.id
                      ? "bg-primary/10 text-primary border-r-2 border-primary"
                      : "text-foreground"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      Day {day.dayNumber}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {day.wordCount}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span>{day.theme}</span>
                    {day.learnedAt && (
                      <span className="text-green-600">✓ 已学</span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
