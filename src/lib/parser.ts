import { isCommonWordWithUncommonMeaning } from "./common-words";

export interface ParsedDay {
  dayNumber: number;
  theme: string;
  words: ParsedWord[];
}

export interface ParsedWord {
  word: string;
  partOfSpeech: string | null;
  definition: string;
  etymology: string | null; // 【拆】
  associations: string | null; // 【记】
  collocations: string | null; // 【搭】
  supplements: string | null; // 【补】
  isHighlighted: boolean; // 是否被 ** 加粗
  isCommonWord: boolean; // 熟词僻义
  rawContent: string; // 该单词的原始 markdown 文本
}

/**
 * Parse a markdown string containing IELTS vocabulary notes into structured data.
 * Handles all edge cases from real user notes.
 */
export function parseMarkdown(content: string): ParsedDay[] {
  const lines = content.split("\n");
  const days: ParsedDay[] = [];

  let currentDay: ParsedDay | null = null;
  let currentWord: ParsedWord | null = null;
  let currentRawLines: string[] = [];
  let currentTag: string | null = null; // tracks multi-line tag content
  let orderIndex = 0;

  function finalizeWord() {
    if (currentWord && currentDay) {
      currentWord.rawContent = currentRawLines.join("\n").trim();
      // Check for 熟词僻义
      currentWord.isCommonWord = isCommonWordWithUncommonMeaning(
        currentWord.word,
        currentWord.definition
      );
      currentDay.words.push(currentWord);
    }
    currentWord = null;
    currentRawLines = [];
    currentTag = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines (but still collect raw content)
    if (trimmed === "") {
      if (currentWord) {
        currentRawLines.push(line);
        currentTag = null; // empty line ends multi-line tag
      }
      continue;
    }

    // Match day header: ## day N（主题）or ## day N (主题)
    const dayMatch = trimmed.match(
      /^##\s+day\s+(\d+)\s*[（(]\s*(.+?)\s*[）)]\s*$/i
    );
    if (dayMatch) {
      finalizeWord();
      currentDay = {
        dayNumber: parseInt(dayMatch[1], 10),
        theme: dayMatch[2],
        words: [],
      };
      days.push(currentDay);
      orderIndex = 0;
      continue;
    }

    // Match word header: #### word or #### **word** (with optional bold)
    // The word line may have part of speech and definition, separated by spaces/tabs
    const wordMatch = trimmed.match(/^####\s+(.+)$/);
    if (wordMatch) {
      finalizeWord();
      if (!currentDay) continue;

      const rawHeader = wordMatch[1];
      currentRawLines = [line];

      const parsed = parseWordHeader(rawHeader);
      currentWord = {
        word: parsed.word,
        partOfSpeech: parsed.partOfSpeech,
        definition: parsed.definition,
        etymology: null,
        associations: null,
        collocations: null,
        supplements: null,
        isHighlighted: parsed.isHighlighted,
        isCommonWord: false,
        rawContent: "",
      };
      orderIndex++;
      continue;
    }

    // If we're inside a word entry, process content lines
    if (currentWord) {
      currentRawLines.push(line);

      // Check for tag lines: 【拆】【记】【搭】【补】 or 【同义替换】etc
      const tagMatch = trimmed.match(/^【([^】]+)】(.*)$/);
      if (tagMatch) {
        const tagName = tagMatch[1];
        const tagContent = tagMatch[2].trim();

        if (tagName === "拆") {
          currentWord.etymology = tagContent;
          currentTag = "etymology";
        } else if (tagName === "记") {
          currentWord.associations = tagContent;
          currentTag = "associations";
        } else if (tagName === "搭") {
          currentWord.collocations = tagContent;
          currentTag = "collocations";
        } else if (tagName === "补") {
          currentWord.supplements = tagContent;
          currentTag = "supplements";
        } else {
          // Other tags like 【同义替换】go into supplements
          const extra = `【${tagName}】${tagContent}`;
          currentWord.supplements = currentWord.supplements
            ? `${currentWord.supplements}\n${extra}`
            : extra;
          currentTag = "supplements";
        }
        continue;
      }

      // Check for bold tag lines: **【搭】...**
      const boldTagMatch = trimmed.match(/^\*\*【([^】]+)】(.*?)\*\*$/);
      if (boldTagMatch) {
        const tagName = boldTagMatch[1];
        const tagContent = boldTagMatch[2].trim();

        if (tagName === "搭") {
          currentWord.collocations = currentWord.collocations
            ? `${currentWord.collocations}; ${tagContent}`
            : tagContent;
          currentTag = "collocations";
        } else if (tagName === "记") {
          currentWord.associations = currentWord.associations
            ? `${currentWord.associations}\n${tagContent}`
            : tagContent;
          currentTag = "associations";
        } else if (tagName === "拆") {
          currentWord.etymology = tagContent;
          currentTag = "etymology";
        } else if (tagName === "补") {
          currentWord.supplements = currentWord.supplements
            ? `${currentWord.supplements}\n${tagContent}`
            : tagContent;
          currentTag = "supplements";
        }
        continue;
      }

      // Continuation lines (indented or non-tag content)
      // If we have a current tag, append to it (multi-line tag content)
      if (currentTag && !trimmed.startsWith("####") && !trimmed.startsWith("##")) {
        const fieldMap: Record<string, keyof ParsedWord> = {
          etymology: "etymology",
          associations: "associations",
          collocations: "collocations",
          supplements: "supplements",
        };
        const field = fieldMap[currentTag];
        if (field) {
          const existing = currentWord[field] as string | null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (currentWord as any)[field] = existing
            ? `${existing}\n${trimmed}`
            : trimmed;
        }
        continue;
      }

      // Non-tag content lines (like "~ emissions →global warming")
      // These go into supplements
      if (
        trimmed.startsWith("~") ||
        trimmed.startsWith("→") ||
        trimmed.startsWith("->")
      ) {
        currentWord.supplements = currentWord.supplements
          ? `${currentWord.supplements}\n${trimmed}`
          : trimmed;
        currentTag = "supplements";
        continue;
      }

      // Any other non-empty, non-header line inside a word goes to supplements
      if (!trimmed.startsWith("#")) {
        currentWord.supplements = currentWord.supplements
          ? `${currentWord.supplements}\n${trimmed}`
          : trimmed;
        currentTag = "supplements";
      }
    }
  }

  // Finalize the last word
  finalizeWord();

  return days;
}

/**
 * Parse a word header line (everything after "#### ").
 *
 * Examples:
 *   "atmosphere\tn.大气层，大气圈；气氛"
 *   "**deteriorate v.恶化，变坏**"
 *   "plain n.平原 adj.简朴的，明白的"
 *   "calamity"
 *   "EL Nino n.厄尔尼诺现象（赤道附近...）"
 *   "pacific adj.平静的，和平的；[P~]太平洋的 n.[the P~]太平洋"
 */
function parseWordHeader(raw: string): {
  word: string;
  partOfSpeech: string | null;
  definition: string;
  isHighlighted: boolean;
} {
  let text = raw.trim();

  // Check for bold markers
  const isHighlighted = text.startsWith("**") && text.endsWith("**");
  if (isHighlighted) {
    text = text.slice(2, -2).trim();
  }

  // Normalize whitespace: replace tabs and multiple spaces with single space
  text = text.replace(/[\t]+/g, " ").replace(/\s{2,}/g, " ");

  // Try to find the word and its definition
  // The word can be multi-word (e.g., "EL Nino", "carbon dioxide")
  // Part of speech markers: n. v. adj. adv. adj/n. etc.
  // Strategy: find the first part-of-speech marker to split word from definition

  const posPattern =
    /\s+((?:n\.|v\.|adj\.|adv\.|prep\.|conj\.|pron\.|int\.|adj\/n\.))/;
  const posMatch = text.match(posPattern);

  if (posMatch && posMatch.index !== undefined) {
    const word = text.slice(0, posMatch.index).trim();
    const rest = text.slice(posMatch.index).trim();

    // The rest contains potentially multiple "pos.definition" pairs
    // e.g., "n.平原 adj.简朴的，明白的"
    // We combine them all into definition
    const definition = rest;

    // Extract just the POS tags
    const posMatches = rest.match(
      /(?:n\.|v\.|adj\.|adv\.|prep\.|conj\.|pron\.|int\.|adj\/n\.)/g
    );
    const partOfSpeech = posMatches ? posMatches.join(" ") : null;

    return { word, partOfSpeech, definition, isHighlighted };
  }

  // No POS found — might be just a word like "calamity"
  // Or might have definition without POS
  return {
    word: text,
    partOfSpeech: null,
    definition: "",
    isHighlighted,
  };
}
