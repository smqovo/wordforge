/**
 * Claude API integration for generating IELTS quizzes.
 */

interface WordData {
  word: string;
  definition: string;
  collocations: string | null;
  isCommonWord: boolean;
}

function buildClozePrompt(words: WordData[], theme: string): string {
  const wordList = JSON.stringify(
    words.map((w) => ({
      word: w.word,
      definition: w.definition,
      collocations: w.collocations,
      isCommonWord: w.isCommonWord ? "★" : "",
    })),
    null,
    2
  );

  return `你是一个雅思英语教师。请根据以下单词列表生成一篇完形填空练习。

要求：
1. 文章约 150-250 词，主题与"${theme}"相关
2. 设置 8-12 个空格，每个空格考察列表中的一个单词或词组
3. 重点考察：词组搭配的正确用法、熟词僻义（标记为★的词）、上下文语境推断
4. 每个空格提供 4 个选项（A/B/C/D），干扰项应为意思相近或拼写相似的词
5. 难度对标雅思阅读 6-7 分水平

单词列表：
${wordList}

请严格按以下 JSON 格式返回，不要包含任何其他内容：
{
  "passage": "文章全文，空格位置用 ___[1]___ 标记",
  "blanks": [
    {
      "number": 1,
      "options": ["A. atmosphere", "B. environment", "C. climate", "D. weather"],
      "answer": "A",
      "explanation": "此处考察 atmosphere 的'大气层'含义，...",
      "relatedWord": "atmosphere"
    }
  ]
}`;
}

function buildReadingPrompt(words: WordData[], theme: string): string {
  const wordList = JSON.stringify(
    words.map((w) => ({
      word: w.word,
      definition: w.definition,
      collocations: w.collocations,
      isCommonWord: w.isCommonWord ? "★" : "",
    })),
    null,
    2
  );

  return `你是一个雅思英语教师。请根据以下单词列表生成一篇阅读理解练习。

要求：
1. 文章约 200-350 词，主题与"${theme}"相关，风格模仿雅思学术类阅读
2. 文章中自然地使用列表中的单词和词组
3. 设计 4-6 道选择题，题型包括：词义推断、细节定位、主旨总结、推理判断
4. 重点考察熟词僻义（标记为★的词）在语境中的特殊含义
5. 难度对标雅思阅读 6-7 分水平

单词列表：
${wordList}

请严格按以下 JSON 格式返回，不要包含任何其他内容：
{
  "passage": "文章全文",
  "questions": [
    {
      "number": 1,
      "question": "题目内容",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "answer": "B",
      "explanation": "解析说明"
    }
  ]
}`;
}

export async function generateQuiz(
  words: WordData[],
  theme: string,
  type: "cloze" | "reading"
) {
  const prompt =
    type === "cloze"
      ? buildClozePrompt(words, theme)
      : buildReadingPrompt(words, theme);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.CLAUDE_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.content[0].text;

  // Clean JSON (remove possible markdown code block wrappers)
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned);
}
