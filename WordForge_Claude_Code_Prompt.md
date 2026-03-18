# WordForge — 雅思单词智能复习系统 开发指令

## 项目概述

构建一个**全栈 Web 应用**，用于雅思单词学习、复习和测验。用户将自己的 Markdown 格式学习笔记导入系统，系统解析笔记为结构化数据，提供笔记浏览、艾宾浩斯遗忘曲线复习、AI 生成测验（完形填空+阅读理解）三大核心功能。要求跨设备同步数据。

---

## 技术栈（严格遵守）

- **前端**: Next.js 14 (App Router) + TypeScript + TailwindCSS + shadcn/ui
- **后端**: Next.js API Routes（无需独立后端）
- **数据库**: PostgreSQL（用 Prisma ORM）
- **AI 测验**: Claude API（model: claude-sonnet-4-20250514）
- **音标服务**: Free Dictionary API（https://api.dictionaryapi.dev/api/v2/entries/en/{word}）
- **认证**: NextAuth.js（简单邮箱密码登录即可）
- **部署**: 适配 Vercel + Supabase（PostgreSQL）

---

## 数据库 Schema（Prisma）

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hashed
  createdAt DateTime @default(now())
  days      Day[]
  vocabBook VocabBookEntry[]
}

model Day {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  dayNumber   Int      // 1, 2, 3...
  theme       String   // "自然地理", "教育" etc.
  learnedAt   DateTime? // 用户标记为已学习的日期，用于计算复习时间
  words       Word[]
  reviewLogs  ReviewLog[]
  createdAt   DateTime @default(now())
  
  @@unique([userId, dayNumber])
}

model Word {
  id            String   @id @default(cuid())
  dayId         String
  day           Day      @relation(fields: [dayId], references: [id], onDelete: Cascade)
  word          String   // 英文单词
  phonetic      String?  // IPA 音标（系统自动补充）
  partOfSpeech  String?  // "n." "v." "adj." 等
  definition    String   // 中文释义
  etymology     String?  // 【拆】词根拆解
  associations  String?  // 【记】派生词/近义词/助记
  collocations  String?  // 【搭】词组搭配，用 ; 分隔多个
  supplements   String?  // 【补】补充知识点
  rawContent    String?  // 无法完全解析时保留原文
  isCommonWord  Boolean  @default(false) // 熟词僻义标记
  orderIndex    Int      // 在当天笔记中的排列顺序
  createdAt     DateTime @default(now())
}

model ReviewLog {
  id          String   @id @default(cuid())
  dayId       String
  day         Day      @relation(fields: [dayId], references: [id])
  userId      String
  round       Int      // 1-6，对应艾宾浩斯的6轮
  reviewDate  DateTime // 实际复习日期
  cardStats   Json     // { mastered: ["wordId1"...], needWork: ["wordId2"...] }
  quizScore   Json?    // { cloze: {score: 8, total: 12}, reading: {score: 4, total: 6} }
  duration    Int?     // 用时（秒）
  createdAt   DateTime @default(now())
}

model VocabBookEntry {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  word        String
  definition  String?
  color       String   @default("yellow") // yellow/red/green/blue
  source      String?  // "Day 1 测验" 标记来源
  addedToReview Boolean @default(false)
  learnedAt   DateTime? // 加入复习的日期
  createdAt   DateTime @default(now())
}
```

---

## Markdown 笔记解析器（核心，必须精确）

这是用户的**真实笔记格式**，解析器必须 100% 兼容以下所有情况：

### 笔记结构规则

```
## day N（主题）          ← 二级标题，天数章节，括号内为当天主题
#### word  n.中文释义     ← 四级标题，单词条目，紧跟词性+释义
【拆】...                 ← 词根词缀拆解（可选）
【记】...                 ← 派生词/近义词/反义词/助记联想（可选）
【搭】...                 ← 词组搭配（可选，多个用 ; 分隔）
【补】...                 ← 补充知识点（可选）
```

### 解析边界情况（全部来自真实笔记，必须处理）

1. **有的单词非常简洁**，只有标题行没有任何【拆】【记】【搭】【补】：
   ```
   #### oxygen n.氧气
   ```

2. **有的单词标题里没有词性**（如专有名词）：
   ```
   #### EL Nino n.厄尔尼诺现象（赤道附近东太平洋水域...）
   #### calamity
   ```
   → `calamity` 没有词性和释义，但下面有【搭】，此时 definition 留空或设为空字符串

3. **有的标题里有多个词性和释义**：
   ```
   #### plain n.平原 adj.简朴的，明白的
   #### pacific adj.平静的，和平的；[P~]太平洋的 n.[the P~]太平洋
   #### marine adj.海生的，海洋的；海事的 n.水兵
   ```
   → 将**全部词性和释义合并**为一个 definition 字符串

4. **单词标题和释义之间有 tab 或多个空格**：
   ```
   #### atmosphere	n.大气层
   #### hydrosphere   n.水圈
   ```

5. **某些单词条目下有非标签内容**（用 ~ 或 → 等符号）：
   ```
   #### carbon dioxide n.二氧化碳
   ~ emissions →global warming
   ```
   → 这类内容归入 supplements

6. **【记】内容多样化**，不仅是近义词，还包括：
   - 派生词：`disastrous adj.灾难性的`
   - 复数形式：`复数形式：phenomena`
   - 联想记忆：`quarter 1/4；quartz 四面体的石头`
   - 同义替换：`currently=nowadays=in today's world`

7. **某些单词被加粗**（用 `**` 包裹），表示重点：
   ```
   #### **deteriorate v.恶化，变坏**
   ```
   → 解析时去掉 `**`，但可标记为重点词

8. **【搭】可能包含多个词组，用 ; 或 ；分隔**：
   ```
   【搭】atmosphere pressure 大气压；working atmosphere 工作氛围
   ```

9. **【补】可能跨多行**：
   ```
   【补】hyg 表示和**水**相关的前缀 
         hygien 卫生 =clearliness
   ```
   → 多行内容合并

10. **一个标签（如【搭】）可能出现在标题行同行也可能独立一行** — 都需支持

### 解析器实现要求

- 用 TypeScript 写一个 `parseMarkdown(content: string): ParsedDay[]` 函数
- 放在 `lib/parser.ts`
- 输出结构：
```typescript
interface ParsedDay {
  dayNumber: number;
  theme: string;
  words: ParsedWord[];
}

interface ParsedWord {
  word: string;
  partOfSpeech: string | null;
  definition: string;
  etymology: string | null;     // 【拆】
  associations: string | null;  // 【记】
  collocations: string | null;  // 【搭】
  supplements: string | null;   // 【补】
  isHighlighted: boolean;       // 是否被 ** 加粗
  rawContent: string;           // 该单词的原始 markdown 文本
}
```
- **必须写单元测试**（用附件中的真实笔记数据测试），确保 day 1 的所有 ~90 个单词都能正确解析

### 熟词僻义识别

内置一个常见基础词列表（约 2000 词，CET-4 级别），当解析到的单词在该列表中，但笔记中的释义包含该词的**非常见含义**时（比如 `plain` 的"平原"义、`current` 的"水流/潮流"义、`pacific` 的"平静的"义、`flat` 的"公寓"义），标记 `isCommonWord: true`。

实现方式：内置一个 `lib/common-words.ts` 文件，包含常见词的**常见释义**关键词映射。当笔记中的释义与常见释义差异较大时标记为熟词僻义。不需要 100% 精确，宁可多标不漏标。

---

## 音标自动补充

在笔记导入/更新时，对每个单词调用 Free Dictionary API 获取音标：
- API: `GET https://api.dictionaryapi.dev/api/v2/entries/en/{word}`
- 取 `phonetics[0].text` 或遍历找到第一个非空的 `text`
- 若 API 查询失败（404 或超时），phonetic 存为 null，前端显示为空
- 注意限流：批量获取时加 100ms 延迟，避免被封
- 音标获取可以异步进行（先保存单词，后台补充音标）

---

## 页面结构与路由

```
/                      → 首页仪表盘（今日复习提醒、学习进度）
/notes                 → 笔记浏览页（左侧天数导航 + 右侧单词卡片列表）
/notes?day=1           → 直接跳转到 Day 1
/review                → 复习总览（今日待复习列表）
/review/[dayId]        → 翻转卡片复习模式
/quiz/[dayId]          → AI 测验页（完形填空 + 阅读理解）
/vocab                 → 生词本
/settings              → 设置页
/login                 → 登录
/register              → 注册
```

---

## 各页面详细设计

### 1. 首页仪表盘 `/`

- 顶部大卡片：今日待复习天数（如 "今日需复习 3 个章节"），点击直接进入复习
- 学习统计：已学习天数 / 总天数、已掌握单词数 / 总单词数
- 连续学习天数（streak）
- 最近复习记录列表

### 2. 笔记浏览页 `/notes`

**布局：**
- 桌面端：左侧固定宽度 sidebar（天数列表） + 右侧内容区
- 移动端：sidebar 收为 hamburger 抽屉

**左侧 sidebar：**
- 列出所有天数："Day 1 - 自然地理"、"Day 2 - ..." 
- 每天显示单词数量徽标
- 当前选中天数高亮
- 顶部有"更新笔记"按钮

**右侧内容区：**
- 顶部搜索框（全局搜索，支持英文单词、中文释义、词组内容模糊匹配）
- 搜索结果以卡片列表展示，每张卡片标注来源天数，点击可跳转
- 单词卡片列表，每个卡片包含：
  - 单词（大字） + 音标（灰色，旁边有小喇叭图标可播放发音）+ 词性标签（彩色胶囊）
  - 中文释义
  - 下方按固定顺序展示：【拆】蓝色块 →【记】绿色块 →【搭】橙色块 →【补】紫色块
  - 每个块用不同背景色和左侧色条区分
  - 若某块不存在则不显示
  - 熟词僻义的单词在右上角显示 "⚡熟词僻义" 标签

**"更新笔记" 按钮：**
- 点击弹出文件选择器，选择 .md 文件
- 上传后显示进度条
- 增量更新：只新增/更新有变化的天数，保留已有的复习记录
- 完成后提示 "更新成功：新增 Day X，共 N 个单词"

### 3. 复习总览页 `/review`

- 计算今日应复习的天数列表，基于艾宾浩斯间隔：
  - 某天被标记为 "已学习"（learnedAt 不为 null）后，按 1/2/4/7/15/30 天间隔安排 6 轮复习
  - 例如 Day 1 在 3/15 学习 → 复习日分别为 3/16、3/17、3/19、3/22、3/30、4/14
- 展示格式：卡片列表，每张写 "Day 1 - 自然地理（第3轮复习）"，显示单词数
- 区分"待复习"（橙色）和"已完成"（绿色）
- 如果某天已过期未复习，标红提示"已逾期 X 天"

### 4. 翻转卡片复习 `/review/[dayId]`

**整体流程：** 三个子轮次依次进行

**轮次 A — 单词释义：**
- 正面：单词 + 音标 + 词性（若为熟词僻义显示 "⚠️ 注意僻义" 提示）
- 背面：完整中文释义 + 【拆】词根拆解（如有）
- 点击卡片翻转（带 3D flip 动画，CSS transform）
- 翻转后底部两个按钮："✅ 已掌握"（绿色）和 "🔄 需加强"（橙色）
- 点击后自动进入下一张
- 标记"需加强"的卡片在本轮次结束后会**再次出现**直到全部标记已掌握或用户选择跳过
- 顶部进度条显示 "12/45"

**轮次 B — 词组搭配：**
- 只出现有【搭】内容的单词（无则跳过）
- 正面：英文词组（如 "atmosphere pressure"）
- 背面：中文含义（"大气压"）
- 同样有"已掌握"/"需加强"按钮
- 若一个单词有多个词组（; 分隔），每个词组单独一张卡片

**轮次 C — 派生词/近义词：**
- 只出现有【记】内容的单词（无则跳过）
- 正面：原单词
- 背面：【记】的完整内容
- 同样有"已掌握"/"需加强"按钮

**轮次完成后：**
- 显示统计摘要：已掌握 X 个、需加强 Y 个
- 两个按钮："进入 AI 测验" 和 "完成复习"
- 点"完成复习"将结果写入 ReviewLog

### 5. AI 测验页 `/quiz/[dayId]`

**生成方式：** 调用 Claude API

**UI 布局：**
- 顶部标题 "Day 1 测验 - 自然地理"
- 两个 tab："完形填空" 和 "阅读理解"
- 各 tab 下有 "生成题目" 按钮，点击后调用 API 生成
- 生成中显示骨架屏/loading 动画
- 支持"重新生成"按钮

**完形填空 Prompt（发给 Claude API）：**

```
你是一个雅思英语教师。请根据以下单词列表生成一篇完形填空练习。

要求：
1. 文章约 150-250 词，主题与"{theme}"相关
2. 设置 8-12 个空格，每个空格考察列表中的一个单词或词组
3. 重点考察：词组搭配的正确用法、熟词僻义（标记为★的词）、上下文语境推断
4. 每个空格提供 4 个选项（A/B/C/D），干扰项应为意思相近或拼写相似的词
5. 难度对标雅思阅读 6-7 分水平

单词列表：
{JSON格式的单词数据，包含word, definition, collocations, isCommonWord}

请严格按以下 JSON 格式返回，不要包含任何其他内容：
{
  "passage": "文章全文，空格位置用 ___[1]___ 标记",
  "blanks": [
    {
      "number": 1,
      "options": ["A. atmosphere", "B. environment", "C. climate", "D. weather"],
      "answer": "A",
      "explanation": "此处考察 atmosphere 的'大气层'含义，..."
      "relatedWord": "atmosphere"
    }
  ]
}
```

**阅读理解 Prompt（发给 Claude API）：**

```
你是一个雅思英语教师。请根据以下单词列表生成一篇阅读理解练习。

要求：
1. 文章约 200-350 词，主题与"{theme}"相关，风格模仿雅思学术类阅读
2. 文章中自然地使用列表中的单词和词组
3. 设计 4-6 道选择题，题型包括：词义推断、细节定位、主旨总结、推理判断
4. 重点考察熟词僻义（标记为★的词）在语境中的特殊含义
5. 难度对标雅思阅读 6-7 分水平

单词列表：
{JSON格式的单词数据}

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
}
```

**答题交互：**
- 用户逐题选择答案（radio button），已选高亮
- 全部做完后点"提交答案"
- 提交后每题旁边标注 ✅/❌
- 错题展开显示：正确答案 + AI 解析说明
- 底部显示得分统计

**生词标记功能（在测验文章中）：**
- 用户可以**选中文章中的任意英文单词**
- 选中后弹出小工具栏（floating toolbar），包含：
  - 4 个颜色圆点（黄/红/绿/蓝），点击即高亮该词
  - "加入生词本" 复选框
  - "查词义" 按钮（调用 Free Dictionary API，弹出释义浮窗）
- 高亮后的词在文章中保持高亮颜色
- 勾选"加入生词本"后写入 VocabBookEntry 表

**实现提示：** 用 `window.getSelection()` API 获取选中文本，用 `<mark>` 标签实现高亮，颜色用 data 属性 + CSS 控制。

### 6. 生词本 `/vocab`

- 列表展示所有标记的生词
- 每行：单词、释义、标记颜色（色块）、来源（"Day 1 测验"）、标记日期
- 筛选：按颜色筛选
- 操作：删除、一键全部加入复习计划（设置 learnedAt 为今天，开始艾宾浩斯循环）
- 支持单个加入/移出复习

### 7. 设置页 `/settings`

- 标记颜色含义自定义（如：红色=完全不认识，黄色=有点印象...）
- AI API Key 配置（存服务端环境变量，前端不显示完整 key）
- 导出数据（JSON 格式）

---

## API 路由设计

```typescript
// 笔记相关
POST /api/notes/upload     // 上传 .md 文件，解析并存储（增量更新）
GET  /api/days             // 获取所有天数列表 { dayNumber, theme, wordCount, learnedAt }
GET  /api/days/[id]/words  // 获取某天全部单词
POST /api/days/[id]/learn  // 标记某天为"已学习"，设置 learnedAt，触发复习计划

// 搜索
GET  /api/search?q=xxx     // 全局搜索单词、释义、词组

// 复习相关
GET  /api/review/today     // 获取今日待复习列表（含已逾期）
POST /api/review/complete  // 提交一次复习结果 { dayId, round, cardStats, duration }

// AI 测验
POST /api/quiz/generate    // 生成测验 { dayId, type: "cloze"|"reading" }
POST /api/quiz/submit      // 提交测验结果 { dayId, type, score, total }

// 生词本
GET  /api/vocab            // 获取生词本列表
POST /api/vocab/mark       // 标记生词 { word, definition, color, source }
DELETE /api/vocab/[id]     // 删除生词
POST /api/vocab/[id]/review // 加入复习计划

// 音标
POST /api/phonetics/fetch  // 批量获取音标（后台任务）
```

---

## UI 设计规范

### 色彩系统

```css
/* 主色 */
--primary: #1A56DB;        /* 蓝色，主按钮、标题 */
--primary-light: #DBEAFE;  /* 浅蓝背景 */

/* 功能色 */
--success: #059669;        /* 绿色，已掌握 */
--warning: #D97706;        /* 橙色，需加强/待复习 */
--danger: #DC2626;         /* 红色，逾期/错误 */

/* 标签色（知识模块） */
--tag-chai: #DBEAFE;       /* 【拆】蓝色 */
--tag-ji: #D1FAE5;         /* 【记】绿色 */
--tag-da: #FED7AA;         /* 【搭】橙色 */
--tag-bu: #E9D5FF;         /* 【补】紫色 */

/* 生词标记色 */
--mark-yellow: #FEF08A;
--mark-red: #FECACA;
--mark-green: #BBF7D0;
--mark-blue: #BFDBFE;
```

### 卡片设计

```
- 圆角: rounded-xl (12px)
- 阴影: shadow-sm, hover 时 shadow-md
- 内边距: p-5
- 知识模块块: 左侧 4px 色条 + 浅色背景 + rounded-lg + p-3 + mb-2
```

### 翻转卡片动画

```css
.card-flip {
  perspective: 1000px;
}
.card-flip-inner {
  transition: transform 0.6s;
  transform-style: preserve-3d;
}
.card-flip-inner.flipped {
  transform: rotateY(180deg);
}
.card-front, .card-back {
  backface-visibility: hidden;
}
.card-back {
  transform: rotateY(180deg);
}
```

### 响应式断点

- 手机 `< 768px`: 单栏，sidebar 收为抽屉
- 平板 `768-1024px`: 双栏，窄 sidebar
- 桌面 `> 1024px`: 完整布局

---

## 关键实现细节

### 1. 艾宾浩斯复习计算逻辑

```typescript
// lib/review.ts
const INTERVALS = [1, 2, 4, 7, 15, 30]; // 天数

function getReviewSchedule(learnedAt: Date): Date[] {
  return INTERVALS.map(days => {
    const date = new Date(learnedAt);
    date.setDate(date.getDate() + days);
    return date;
  });
}

function getTodayReviews(days: Day[]): ReviewItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return days
    .filter(day => day.learnedAt)
    .map(day => {
      const schedule = getReviewSchedule(day.learnedAt!);
      const completedRounds = day.reviewLogs.length;
      
      if (completedRounds >= 6) return null; // 已完成所有轮次
      
      const nextReviewDate = schedule[completedRounds];
      nextReviewDate.setHours(0, 0, 0, 0);
      
      if (nextReviewDate <= today) {
        return {
          day,
          round: completedRounds + 1,
          scheduledDate: nextReviewDate,
          isOverdue: nextReviewDate < today,
          overdueDays: Math.floor((today.getTime() - nextReviewDate.getTime()) / 86400000),
        };
      }
      return null;
    })
    .filter(Boolean);
}
```

### 2. Claude API 调用

```typescript
// lib/ai.ts
async function generateQuiz(words: Word[], theme: string, type: "cloze" | "reading") {
  const wordData = words.map(w => ({
    word: w.word,
    definition: w.definition,
    collocations: w.collocations,
    isCommonWord: w.isCommonWord, // 标记为 ★ 告诉 AI 重点考
  }));

  const prompt = type === "cloze" ? buildClozePrompt(wordData, theme) : buildReadingPrompt(wordData, theme);

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

  const data = await response.json();
  const text = data.content[0].text;
  
  // 清洗 JSON（去除可能的 markdown 代码块包裹）
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}
```

### 3. 生词标记实现

在测验文章容器上监听 `mouseup`/`touchend` 事件：

```typescript
function handleTextSelection() {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;
  
  const text = selection.toString().trim();
  if (!text || text.includes(" ")) return; // 只支持单个单词
  
  // 获取选中位置，显示浮动工具栏
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  showToolbar({ x: rect.left + rect.width / 2, y: rect.top - 10, word: text });
}
```

高亮用 `<mark>` 标签 wrap 选中内容，颜色用 CSS class：

```typescript
function highlightWord(color: string) {
  const selection = window.getSelection();
  if (!selection) return;
  
  const range = selection.getRangeAt(0);
  const mark = document.createElement("mark");
  mark.className = `highlight-${color}`;
  range.surroundContents(mark);
}
```

---

## 项目文件结构

```
wordforge/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 根布局（含导航栏）
│   │   ├── page.tsx                # 首页仪表盘
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── notes/page.tsx          # 笔记浏览
│   │   ├── review/
│   │   │   ├── page.tsx            # 复习总览
│   │   │   └── [dayId]/page.tsx    # 翻转卡片复习
│   │   ├── quiz/
│   │   │   └── [dayId]/page.tsx    # AI 测验
│   │   ├── vocab/page.tsx          # 生词本
│   │   ├── settings/page.tsx
│   │   └── api/
│   │       ├── notes/upload/route.ts
│   │       ├── days/route.ts
│   │       ├── days/[id]/words/route.ts
│   │       ├── days/[id]/learn/route.ts
│   │       ├── search/route.ts
│   │       ├── review/today/route.ts
│   │       ├── review/complete/route.ts
│   │       ├── quiz/generate/route.ts
│   │       ├── quiz/submit/route.ts
│   │       ├── vocab/route.ts
│   │       ├── vocab/[id]/route.ts
│   │       └── phonetics/fetch/route.ts
│   ├── components/
│   │   ├── ui/                     # shadcn/ui 组件
│   │   ├── WordCard.tsx            # 单词卡片（浏览模式）
│   │   ├── FlipCard.tsx            # 翻转卡片（复习模式）
│   │   ├── DaySidebar.tsx          # 天数导航侧边栏
│   │   ├── SearchBar.tsx           # 搜索组件
│   │   ├── ReviewCalendar.tsx      # 复习日历
│   │   ├── QuizRenderer.tsx        # 测验渲染（完形+阅读）
│   │   ├── TextHighlighter.tsx     # 生词标记工具
│   │   └── ProgressBar.tsx         # 进度条
│   └── lib/
│       ├── parser.ts               # Markdown 解析器（核心）
│       ├── parser.test.ts          # 解析器测试
│       ├── review.ts               # 艾宾浩斯复习逻辑
│       ├── ai.ts                   # Claude API 调用
│       ├── phonetics.ts            # 音标获取
│       ├── common-words.ts         # CET-4 常见词表
│       ├── prisma.ts               # Prisma client 单例
│       └── auth.ts                 # NextAuth 配置
├── public/
│   └── sample-notes.md             # 示例笔记
├── .env.example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 开发顺序（请严格按此顺序）

1. **项目初始化**: Next.js + Prisma + TailwindCSS + shadcn/ui 安装配置
2. **数据库**: 创建 Schema，运行 migration
3. **解析器**: 实现 `parser.ts` 并用真实笔记数据写测试通过
4. **认证**: NextAuth 邮箱密码登录
5. **笔记上传+浏览**: 上传 API + 笔记浏览页（含搜索）
6. **复习系统**: 艾宾浩斯调度 + 翻转卡片复习页
7. **AI 测验**: Claude API 集成 + 完形填空 + 阅读理解 + 答案核对
8. **生词标记**: 文本选中 + 高亮 + 生词本页
9. **仪表盘**: 首页统计数据
10. **音标补充**: 异步获取音标
11. **移动端适配**: 响应式优化
12. **部署配置**: Vercel + Supabase

---

## .env.example

```
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
CLAUDE_API_KEY="sk-ant-..."
```

---

## 附件

将用户的 `雅思.md` 笔记文件放在 `public/sample-notes.md`，开发时作为测试数据使用。解析器必须能 100% 正确解析这份文件。
