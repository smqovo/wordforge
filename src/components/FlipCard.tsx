"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  onMastered: () => void;
  onNeedWork: () => void;
}

export function FlipCard({ front, back, onMastered, onNeedWork }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Card */}
      <div
        className="card-flip cursor-pointer mb-6"
        onClick={() => setFlipped(!flipped)}
        style={{ minHeight: "250px" }}
      >
        <div
          className={`card-flip-inner relative w-full ${
            flipped ? "flipped" : ""
          }`}
          style={{ minHeight: "250px" }}
        >
          {/* Front */}
          <div className="card-front absolute inset-0 bg-white rounded-xl border shadow-md p-8 flex flex-col items-center justify-center">
            {front}
          </div>
          {/* Back */}
          <div className="card-back absolute inset-0 bg-white rounded-xl border shadow-md p-8 flex flex-col items-center justify-center">
            {back}
          </div>
        </div>
      </div>

      {/* Buttons (only show when flipped) */}
      {flipped && (
        <div className="flex gap-4 justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFlipped(false);
              onMastered();
            }}
            className="flex-1 max-w-[200px] bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            ✅ 已掌握
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFlipped(false);
              onNeedWork();
            }}
            className="flex-1 max-w-[200px] bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            🔄 需加强
          </button>
        </div>
      )}

      {!flipped && (
        <p className="text-center text-sm text-muted-foreground">
          点击卡片翻转查看答案
        </p>
      )}
    </div>
  );
}
