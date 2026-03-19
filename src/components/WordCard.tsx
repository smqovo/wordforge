"use client";

import { Badge } from "@/components/ui/badge";

interface WordCardProps {
  word: string;
  phonetic?: string | null;
  partOfSpeech?: string | null;
  definition: string;
  etymology?: string | null;
  associations?: string | null;
  collocations?: string | null;
  supplements?: string | null;
  isCommonWord?: boolean;
  dayNumber?: number;
  theme?: string;
}

export function WordCard({
  word,
  phonetic,
  partOfSpeech,
  definition,
  etymology,
  associations,
  collocations,
  supplements,
  isCommonWord,
  dayNumber,
}: WordCardProps) {
  return (
    <div className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="text-xl font-bold">{word}</h3>
          {phonetic && (
            <span className="text-sm text-muted-foreground">{phonetic}</span>
          )}
          {partOfSpeech && (
            <Badge variant="secondary" className="text-xs">
              {partOfSpeech}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isCommonWord && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap">
              ⚡熟词僻义
            </span>
          )}
          {dayNumber !== undefined && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Day {dayNumber}
            </span>
          )}
        </div>
      </div>

      {/* Definition */}
      {definition && (
        <p className="text-base text-foreground mb-3">{definition}</p>
      )}

      {/* Knowledge blocks */}
      <div className="space-y-2">
        {etymology && (
          <div className="flex rounded-lg bg-[#DBEAFE] overflow-hidden">
            <div className="w-1 bg-blue-500 shrink-0" />
            <div className="p-3 text-sm">
              <span className="font-semibold text-blue-700">【拆】</span>
              <span className="text-blue-900 whitespace-pre-wrap">{etymology}</span>
            </div>
          </div>
        )}

        {associations && (
          <div className="flex rounded-lg bg-[#D1FAE5] overflow-hidden">
            <div className="w-1 bg-green-500 shrink-0" />
            <div className="p-3 text-sm">
              <span className="font-semibold text-green-700">【记】</span>
              <span className="text-green-900 whitespace-pre-wrap">{associations}</span>
            </div>
          </div>
        )}

        {collocations && (
          <div className="flex rounded-lg bg-[#FED7AA] overflow-hidden">
            <div className="w-1 bg-orange-500 shrink-0" />
            <div className="p-3 text-sm">
              <span className="font-semibold text-orange-700">【搭】</span>
              <span className="text-orange-900 whitespace-pre-wrap">{collocations}</span>
            </div>
          </div>
        )}

        {supplements && (
          <div className="flex rounded-lg bg-[#E9D5FF] overflow-hidden">
            <div className="w-1 bg-purple-500 shrink-0" />
            <div className="p-3 text-sm">
              <span className="font-semibold text-purple-700">【补】</span>
              <span className="text-purple-900 whitespace-pre-wrap">{supplements}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
