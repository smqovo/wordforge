"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface HighlightedWord {
  word: string;
  color: string;
  addToVocab: boolean;
}

interface TextHighlighterProps {
  children: React.ReactNode;
  dayNumber?: number;
  onAddToVocab?: (word: string, color: string, source: string) => void;
}

interface ToolbarPosition {
  x: number;
  y: number;
  word: string;
}

const COLORS = [
  { key: "yellow", bg: "bg-mark-yellow", hex: "#FEF08A" },
  { key: "red", bg: "bg-mark-red", hex: "#FECACA" },
  { key: "green", bg: "bg-mark-green", hex: "#BBF7D0" },
  { key: "blue", bg: "bg-mark-blue", hex: "#BFDBFE" },
];

export function TextHighlighter({
  children,
  dayNumber,
  onAddToVocab,
}: TextHighlighterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [toolbar, setToolbar] = useState<ToolbarPosition | null>(null);
  const [highlights, setHighlights] = useState<HighlightedWord[]>([]);
  const [addToVocab, setAddToVocab] = useState(false);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }

    const text = selection.toString().trim();
    // Only support single English words (no spaces, only letters/hyphens)
    if (!text || /\s/.test(text) || !/^[a-zA-Z-]+$/.test(text)) {
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (containerRect) {
      setToolbar({
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top - containerRect.top - 10,
        word: text.toLowerCase(),
      });
      setAddToVocab(false);
    }
  }, []);

  // Close toolbar when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (toolbar && containerRef.current) {
        const toolbarEl = containerRef.current.querySelector('[data-toolbar]');
        if (toolbarEl && !toolbarEl.contains(e.target as Node)) {
          // Small delay to allow button clicks to register
          setTimeout(() => setToolbar(null), 100);
        }
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [toolbar]);

  const handleHighlight = (color: string) => {
    if (!toolbar) return;

    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      try {
        const range = selection.getRangeAt(0);
        const mark = document.createElement("mark");
        mark.className = `highlight-${color} rounded px-0.5`;
        range.surroundContents(mark);
        selection.removeAllRanges();
      } catch {
        // surroundContents can fail if selection spans multiple elements
      }
    }

    setHighlights((prev) => [
      ...prev.filter((h) => h.word !== toolbar.word),
      { word: toolbar.word, color, addToVocab },
    ]);

    if (addToVocab && onAddToVocab) {
      const source = dayNumber ? `Day ${dayNumber} 测验` : "测验";
      onAddToVocab(toolbar.word, color, source);
    }

    setToolbar(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseUp={handleTextSelection}
      onTouchEnd={handleTextSelection}
    >
      {children}

      {/* Floating toolbar */}
      {toolbar && (
        <div
          data-toolbar
          className="absolute z-50 bg-white rounded-lg shadow-lg border p-3 -translate-x-1/2"
          style={{
            left: toolbar.x,
            top: toolbar.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <p className="text-xs text-muted-foreground mb-2 text-center">
            「{toolbar.word}」
          </p>

          {/* Color dots */}
          <div className="flex gap-2 justify-center mb-2">
            {COLORS.map(({ key, hex }) => (
              <button
                key={key}
                onClick={() => handleHighlight(key)}
                className="w-7 h-7 rounded-full border-2 border-gray-300 hover:border-gray-500 transition-colors hover:scale-110"
                style={{ backgroundColor: hex }}
                title={`标记为${key}`}
              />
            ))}
          </div>

          {/* Add to vocab checkbox */}
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={addToVocab}
              onChange={(e) => setAddToVocab(e.target.checked)}
              className="rounded"
            />
            <span>加入生词本</span>
          </label>
        </div>
      )}
    </div>
  );
}
