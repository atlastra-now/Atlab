# Product Lab · 开发交接说明（第一阶段）

> 给 Claude Code 的唯一依据。视觉方向、技术栈和内容均已确认，**开发中不再探索新的技术栈或视觉风格**。遇到本文没有覆盖的问题，按「更简单、更克制、与现有规范一致」的方向处理，并在提交说明里记录。

**随附文件**

| 文件 | 用途 |
|---|---|
| `HANDOFF.md` | 本说明 |
| `content/case-01-source.md` | 文章母稿。已并入第六章修订稿和已确认的去重，**文字以此为准** |
| `reference/lab.html` + `reference/img/` | 视觉参考页（浏览器直接打开）。只参考版式、字级、间距和图组效果；页面里的示例卡片、灰色占位、Google Fonts 加载方式**不进入正式站** |
| `reference/img/*.webp` | 已有的 3 张真实截图（用户名已打码） |

建议放进仓库：本说明放 `docs/HANDOFF.md`，母稿放 `docs/case-01-source.md`，参考页放 `docs/reference/`。仓库根目录的 `CLAUDE.md` 只写一句：「开发依据见 docs/HANDOFF.md」。

---

## 1. 第一阶段目标

上线一个可以独立访问的个人 **Product Lab** 网站，核心是 **Spotify × QQ 音乐 AI 歌单 Case Study** 这一篇文章。

**定位**：Clean Independent Digital Publication × Product Lab。首页参考 Bandcamp Daily 的内容网格，文章页参考 Every 的阅读结构，两者共用同一套视觉规范。整体简洁、有层次，只有少量巧思；个性来自真实截图、清楚的字级和留白，不来自装饰。

**第一阶段要做**

- 首页（只展示真实存在的文章）
- 文章页模板 + 这一篇 Case Study
- 404 页
- 截图点击放大
- GitHub Pages 自动部署，预留自定义域名

**第一阶段不做**

- CMS、后台、数据库、任何服务器端运行时
- 通用组件库、设计系统文档站、Storybook
- React 或其他前端框架（第一阶段没有需要它的交互）
- 搜索、标签页、评论、订阅、统计、多语言
- 手动切换深浅色的按钮（只跟随系统）
- 页面动效（不做淡入、视差、滚动动画）
- 为填满版面而虚构的文章、卡片、截图或数据

---

## 2. 技术栈

| 项 | 选择 | 说明 |
|---|---|---|
| 框架 | **Astro**（当前稳定版） | 静态输出（`output: 'static'`），默认零 JavaScript |
| 语言 | TypeScript（strict） | |
| 内容 | MDX（`@astrojs/mdx`）+ Content Collections | 每篇文章一个文件夹 |
| 样式 | 原生 CSS + CSS 变量 | 不引入 Tailwind 或 CSS-in-JS |
| 图片 | `astro:assets`（`<Picture>` / `getImage`） | 自动生成 WebP 和多尺寸 |
| 交互 | 一个原生 JS 脚本（放大查看） | 不用框架 |
| 部署 | GitHub Actions → GitHub Pages | 无服务器依赖 |

---

## 3. 项目目录

```
product-lab/
├─ astro.config.mjs
├─ package.json
├─ tsconfig.json
├─ CLAUDE.md
├─ docs/
│  ├─ HANDOFF.md
│  ├─ case-01-source.md
│  └─ reference/                     # lab.html + img/
├─ public/
│  ├─ favicon.svg                    # ✱ 标记
│  ├─ fonts/                         # 自托管字体（见 §10）
│  └─ CNAME                          # 启用自定义域名时再添加
├─ scripts/
│  └─ subset-quote-font.mjs          # 生成宋体子集
├─ src/
│  ├─ content.config.ts              # 文章集合的 schema
│  ├─ content/
│  │  └─ articles/
│  │     └─ ai-playlist-spotify-qq/
│  │        ├─ index.mdx
│  │        └─ images/               # 本文全部截图
│  ├─ components/
│  │  ├─ SiteHeader.astro
│  │  ├─ SiteFooter.astro
│  │  ├─ ArticleHeader.astro
│  │  ├─ HeroFigure.astro
│  │  ├─ Figure.astro
│  │  ├─ StageMatrix.astro
│  │  ├─ Log.astro
│  │  ├─ Sidenote.astro
│  │  ├─ Verdict.astro
│  │  ├─ SectionBreak.astro
│  │  └─ ArticleCard.astro
│  ├─ layouts/
│  │  ├─ BaseLayout.astro            # <head>、字体、页眉页脚、Lightbox 脚本
│  │  └─ ArticleLayout.astro
│  ├─ pages/
│  │  ├─ index.astro
│  │  ├─ articles/[slug].astro
│  │  └─ 404.astro
│  ├─ scripts/
│  │  └─ lightbox.ts
│  ├─ styles/
│  │  ├─ tokens.css                  # 全部设计变量
│  │  ├─ base.css                    # 重置、字体、全局排版
│  │  └─ prose.css                   # 文章正文：标题、段落、列表、表格
│  └─ utils/
│     ├─ url.ts                      # 统一处理 base 路径
│     └─ reading-time.ts
└─ .github/workflows/deploy.yml
```

组件只有上面 11 个，都是这篇文章实际用到的。不要预先做「以后可能用到」的组件。

---

## 4. 内容结构

### 4.1 文章 frontmatter（`src/content.config.ts` 用 zod 校验）

```yaml
title: 当音乐发现可以被 Prompt
kind: Case Study            # 栏目：Case Study / Teardown / Notes …
issue: 1                    # 栏目内编号，显示为 "Case Study 01"
topic: AI 音乐发现
dek: Spotify Prompted Playlist 与 QQ 音乐智能歌单的产品研究：自然语言如何改变人们表达、修正和保留自己的音乐需求。
date: 2026-10              # 年-月
cover: ./images/hero-qq-playlist.webp
coverAlt: QQ 音乐智能歌单界面
draft: false               # true 的文章不进入生产构建
heroPrompt: 陌生城市的周日下午
heroPromptNote: 一个无法用曲风标签描述的需求。图中是另外两次测试：「让人想哭的快乐」与「雨天下午写代码」。
findings:                  # 文章开头「本文的三个发现」
  - { n: "04.1", href: "#f-04-1", text: "AI 让难以描述的感受和难以操作的规则，都变成可以探索的需求。" }
  - { n: "04.2", href: "#f-04-2", text: "用户通过结果发现偏好，AI 通过反馈理解需求，修正是双向的。" }
  - { n: "04.3", href: "#f-04-3", text: "AI 歌单没有单一终点。收藏几首歌就离开，也可能是一次成功。" }
```

阅读时间自动计算：中文按每分钟 400 字，向上取整。

### 4.2 首页规则：只展示真实内容

- 只列出 `draft: false` 的文章，按 `date` 倒序。
- **只有 1 篇时**：首页只有站点简介一行和这篇的头条展示（大图 + 标题 + 导语 + 栏目 · 阅读时间），不显示卡片网格和文章索引。
- **2–3 篇时**：最新一篇做头条，其余进入三栏卡片网格。
- **4 篇及以上时**：卡片网格下方再加文章索引列表。
- 不出现「即将发布」「示例」「Coming soon」或空卡片。
- 站点简介一行由作者提供（见 §12），没有提供前先不显示。

### 4.3 正文写法

- 母稿 `case-01-source.md` 转成 `index.mdx`。**不增删观点、结论、数据和功能**，只做结构转换。
- 证据前缀直接写在文字里：`观察｜`、`判断｜`、`待验证｜`、`补充观察｜`、`示意｜`。组件和图注遇到这些前缀时，自动把前缀加粗为 `--ink-2`。
- 章节标题加锚点 id：`f-04-1`、`f-04-2`、`f-04-3`，其余按 `ch-01` … `ch-07`。
- 母稿中的 `<!-- … -->` 注释是给开发者的说明，处理后删除。

---

## 5. 视觉规范

> 参考页 `reference/lab.html` 的「文章页」「首页」两个标签是最终效果；「图组」标签里的框选和引导线已经取消（见 §6）。

### 5.1 颜色

整站中性色，**没有站点强调色**。颜色只来自截图和项目素材。

```css
:root{
  --bg:#FFFFFF;  --ink:#111111;  --ink-2:#55554F;  --muted:#8C8C86;
  --line:#E6E6E1; --wash:#F4F4F1;
  --spotify:#1DB954; --qq:#F0B400;     /* 只用作 6px 圆点 */
}
@media (prefers-color-scheme: dark){
  :root{ --bg:#111112; --ink:#EEEEEA; --ink-2:#B4B4AE; --muted:#85857F;
         --line:#2A2A2C; --wash:#1B1B1D; color-scheme:dark; }
}
```

- `--wash` 只用于图片加载前的底色。
- 品牌色只出现在截图上方的产品标签里，形式是 6px 圆点。
- 不使用渐变、色块背景、彩色卡片、彩色边框。

### 5.2 字体

| 角色 | 字体 | 说明 |
|---|---|---|
| 西文与数字 | Schibsted Grotesk（400 / 500 / 700） | 自托管 woff2 |
| 中文正文与标题 | 系统字体：`"PingFang SC","HarmonyOS Sans SC","Microsoft YaHei","Noto Sans SC",sans-serif` | 不下载中文黑体 |
| 原话 | Noto Serif SC 500，**按实际用字子集化** | 只用于逐字引用 |

```css
--sans:"Schibsted Grotesk","PingFang SC","HarmonyOS Sans SC","Microsoft YaHei","Noto Sans SC",sans-serif;
--quote:"Quote Serif","Noto Serif SC","Songti SC","STSong",serif;
```

**原话用宋体**是全站两个固定细节之一：Prompt、用户反馈、AI 输出、截图中的原文，凡是逐字引用的都用 `--quote`；作者自己的观点、判断一律用黑体。

### 5.3 字级

| 名称 | 桌面 | 手机（≤620px） | 字重 | 用途 |
|---|---|---|---|---|
| Title | 46 / 56，字距 -0.025em | 31 / 41 | 700 | 文章标题，每页一次 |
| Feature | 32 / 42 | 26 / 36 | 700 | 首页头条标题 |
| H2 | 30 / 40 | 24 / 34 | 700 | 章（01–07） |
| H3 | 24 / 34 | 20 / 31 | 700 | 节（04.1、06 中的 01–05 等） |
| H4 | 18 / 30 | 17 / 29 | 700 | 小标题 |
| Dek | 20 / 34，`--ink-2` | 18 / 31 | 400 | 文章导语、每节核心发现 |
| Body | 17 / 32 | 17 / 31 | 400 | 正文 |
| Card | 20 / 29 | 20 / 29 | 700 | 首页卡片标题 |
| Quote L | 27 / 40，`--quote` | 23 / 35 | 500 | 对话记录中用户的话、Hero Prompt（30 / 44） |
| Quote M | 19 / 32，`--quote`，`--ink-2` | 16 / 28 | 500 | 对话记录中 AI 的话 |
| Verdict | 25 / 40 | 21 / 34 | 700 | 判断句 |
| Caption 1 | 15 / 24 | 同 | 500 | 图注第一行 |
| Caption 2 | 13 / 20，`--muted` | 同 | 400 | 图注第二行、边注 |
| Kind | 12 / 16，字距 0.02em | 同 | 700 | 栏目标签，例如「Case Study 01 · AI 音乐发现」 |
| Meta | 13 / 20，`--muted` | 同 | 400 | 日期、阅读时间 |

数字一律使用 `font-variant-numeric: tabular-nums`。标题使用 `text-wrap: balance`。

### 5.4 宽度与网格

| 宽度 | 值 | 放什么 |
|---|---|---|
| 阅读栏 | 680px | 标题、正文、列表、表格、对话记录、判断、图注 |
| 宽图 | 960px | 双产品对照、前后变化 |
| 通栏 | 1200px | Hero 图组、第 03 章泳道、首页 12 栏网格 |

- 页边距：<760px 为 20px，760–1199px 为 32px，≥1200px 为 48px。均写成 `max(20px, env(safe-area-inset-left))` 这类形式。
- 首页 12 栏，栏间距 24px。头条：图 8 栏 + 文字 4 栏；卡片：3 栏（≤900px 两栏，≤620px 一栏）。
- **文字永远不出阅读栏**，只有图片可以出栏。
- 边注：≥1180px 时挂在阅读栏右侧，宽 220px；以下接在段落之后。

### 5.5 间距

只从这一组取值：`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 56 · 64 · 88`。

| 关系 | 间距 |
|---|---|
| 栏目标签 → 标题 | 14–22 |
| 标题 → 导语 | 18–20 |
| 段落之间 | 20 |
| 产品标签 → 图片 | 8 |
| 图片 → 图注 | 16 |
| 正文 → 图组 / 模块之间 | 56–64 |
| 章与章之间 | 88，中间放一个 ✱ |

### 5.6 固定细节（全站只有两个）

1. **✱ 标记**：一个三笔交叉的星号（SVG，见参考页 `#ast`）。只用在两处：网站标志「Product Lab✱」和章节分隔。其他地方不用。
2. **原话用宋体**：见 §5.2。

### 5.7 不要做的

圆角卡片、阴影卡片、徽章标签、彩色色块、虚线框、装饰箭头、巨大章节编号、英文海报大标题、渐变、玻璃拟态、插画、模拟手机 UI、生成的封面、等宽字体标签。

---

## 6. 截图与图注规则

### 6.1 原则：每组图先回答「读者应该从这里看到什么」

- **竞品对照**要保证可比：Spotify 永远在左，QQ 音乐在右。
- **前后变化**要突出改变的位置：同一界面使用相同裁切；触发变化的那张加 2px `--ink` 描边。
- **单图解释**要突出关键机制：裁切到机制所在的区域。
- **不强制等高或统一裁切**。截图来自不同 Prompt 或不同场景时，各自保留必要的上下文，并在图注里写明比较范围。
- 截图上**不加**框选、引导线、编号圆点或文字。重点靠裁切和图注说明。

### 6.2 排法（都由一个 `Figure` 组件实现，用 `layout` 区分）

| layout | 宽度 | 用途 |
|---|---|---|
| `single` | 阅读栏 | 一张截图：手机截图最宽 300px，图注在下 |
| `pair` | 960 | 双产品对照，两栏 |
| `before-after` | 960 | 左：完整截图（约 4/10）；右：2–3 个放大的局部，从上到下排列，带 a / b / c 和一句说明 |
| `row` | 960 或 1200 | 3–5 张同一流程的连续步骤；≤900px 时横向滑动 |

第 03 章五阶段泳道不用 `Figure`，用专门的 `StageMatrix`（见 §7）。

### 6.3 图片处理

- 只裁切，不重绘。无设备外框、无阴影，圆角 3px。
- 浅色截图加 `inset 0 0 0 1px rgba(0,0,0,.07)` 描边。
- 产品标签写在图片上方：6px 品牌圆点 + 产品名 + 灰色的情境，例如「● Spotify　对话优化 ·『雨天下午写代码』」。
- 一行最多 5 张手机截图；手机端最多 2 张，超出部分横向滑动。
- 两组图之间至少隔一段文字。

### 6.4 图注：两行

```
图 3　同样是推荐理由，Spotify 写声音，QQ 音乐写歌词        ← 第一行：读者应该看到什么（15/24，500，--ink）
观察｜Spotify 描述节奏如何服务场景……比较范围｜两张截图来自不同的 Prompt……   ← 第二行：观察 + 比较范围（13/20，--muted）
```

- 图片编号全文连续：图 1、图 2 ……，由作者在 MDX 中写 `n`。
- 第二行没有比较范围时，只写观察。

### 6.5 点击放大（全站所有截图）

- 所有截图都可以点击或用键盘（Tab 聚焦，Enter / Space 打开）放大。
- 打开后：深色遮罩（`rgba(10,10,11,.95)`），原图按 `min(560px, 100%)` 宽显示，上下滚动查看完整截图。顶部一行写图注第一行、序号「1 / 3」、上一张、下一张、关闭。
- 方向键切换同一组的图片，Esc 关闭，关闭后焦点回到原来的图片；打开时锁定页面滚动。
- 局部裁切的图片放大时显示**完整原图**，并滚动到 `data-focus`（0–1 的比例）所在的位置。
- 放大用的原图只在打开时加载（宽度 1080–1200 的 WebP），不进入首屏。
- 实现参考：`reference/lab.html` 底部的 Lightbox 脚本。

---

## 7. 组件说明

| 组件 | 作用 | 关键 props |
|---|---|---|
| `SiteHeader` | 标志「Product Lab✱」+ 导航「文章」，底部 1px `--ink` 线 | — |
| `SiteFooter` | 作者名、联系方式、返回首页 | 内容由作者提供 |
| `ArticleHeader` | 栏目标签、标题、导语、署名行（「独立研究 · 约 N 分钟」） | 读取 frontmatter |
| `HeroFigure` | 通栏：左侧 Prompt（宋体）+ 说明，右侧三张主次分明的截图，底边对齐，宽度比约 2 : 3.4 : 2.5；之后是「本文的三个发现」列表 | `prompt`、`note`、`images[]`（含 `weight`、`product`、`label`）、`findings[]` |
| `Figure` | 见 §6.2 | `n`、`layout`、`width`、`items[]`、`what`、`note` |
| `StageMatrix` | 第 03 章：行为产品，列为五个阶段，每格一行说明，有截图时显示缩略图（9:16），没有截图时只显示文字；≤900px 时容器横向滚动 | `stages[]`、`rows[]` |
| `Log` | 对话记录：左侧说话人和动作（13px），右侧原话（用户 Quote L，AI Quote M）；被强调的一轮加下划线；下方一行灰色总结 | `turns[]`、`summary` |
| `Sidenote` | 编号边注 | `n`、内容 |
| `Verdict` | 判断：顶部 1px `--ink` 线，「判断」标签，25px 判断句，可选一行「待验证｜」 | `title`、`hypothesis` |
| `SectionBreak` | 居中 ✱，上下各 88px 间距 | — |
| `ArticleCard` | 首页卡片：4:3 封面、栏目标签、标题、导语两行、阅读时间；没有边框 | 读取 frontmatter |

`Figure.items[]` 的每一项：`src`、`alt`、`product?: 'spotify' | 'qq'`、`label?`、`context?`、`crop?`（object-position，例如 `'top'`、`'50% 67.5%'`）、`ratio?`（`'9/16'`、`'4/5'`、`'3.18'` 等）、`focus?`（放大时的定位比例）、`emphasis?`（2px 描边）。

---

## 8. 文章页逐章实现

| 章节 | 实现 | 图片 |
|---|---|---|
| 页眉 | `ArticleHeader` | — |
| Hero | `HeroFigure`，图 1：左 Spotify 对话优化（weight 2）、中 QQ 智能歌单（3.4，主图，9:15）、右 QQ 音乐 AI 对话（2.5）。图注：「两款产品的 AI 歌单与对话入口」/「观察｜个人账号实测截图，用户名已打码。三张图来自不同 Prompt，只用于呈现产品形态。」 | 3 张已有 |
| 01 | 正文；三个研究问题用有序列表 | — |
| 02 | 正文；三类任务用列表；「局限与测试条件」一节；测试条件表格待作者提供数据后用普通表格呈现 | — |
| 03 | 原表格改为 `StageMatrix`（文字取自母稿表格）；「关键观察」正文 | 已有：Spotify「调整优化」格用 `spotify-refine`，QQ「歌单生成」格用 `qq-playlist`；其余格先只放文字 |
| 04.1 | 正文；Product Insight 用 `Verdict` | S1、S2 如有则用 `pair` |
| 04.2 | 核心发现用 Dek；「陌生城市的周日下午」四轮对话用 `Log`，第三轮「更明亮、乐观一点」加下划线，summary：「用户通过结果发现自己的偏好；AI 通过反馈获得更明确的方向。」AI 的两轮标注「据简介概括」；图 3（`pair`）；图 4（`before-after`）；补充观察用 `Sidenote`；Product Insight 用 `Verdict`，「是否会提高……仍需要进一步验证」作为 `hypothesis` | 见下表 |
| 04.3 | 正文；Product Insight 用 `Verdict` | S7、S9–S11 如有则用 `row` |
| 05 | 正文；Opportunity Prioritization 用普通表格 | — |
| 06 | 母稿第六章原样转换：Go / No-Go 用有序列表，指标用表格，取舍用列表；Product Decision 用 `Verdict` | S11 如有则用 `single` |
| 07 | 价值路径表格；正文；Reflection 中「用户主导，而非情绪驱动」作为 H4 | — |
| 页脚 | `SiteFooter` | — |

**04.2 的两组图（已有素材，参数可直接使用）**

图 3 · `pair`
- 第一行：「同样是推荐理由，Spotify 写声音，QQ 音乐写歌词」
- 第二行：「观察｜Spotify 描述节奏如何服务场景；QQ 音乐的逐首理由围绕歌词和情绪展开。比较范围｜两张截图来自不同的 Prompt 和不同入口（对话优化、智能歌单）。这里只比较解释的写法，不比较推荐质量。」
- 左：`spotify-refine.webp`，Spotify，「对话优化 ·『雨天下午写代码』」，`ratio 9/16`，`crop top`，`focus .43`
- 右：`qq-playlist.webp`，QQ 音乐，「智能歌单 ·『让人想哭的快乐』」，`ratio 9/16`，`crop bottom`，`focus .62`
- 每张最宽 340px

图 4 · `before-after`
- 第一行：「一句否定，让 AI 重新理解需求」
- 第二行：「观察｜同一段 Spotify 对话中的三个时刻：第一次说明、用户的否定反馈、AI 开始理解。比较范围｜同一 Prompt、同一会话。截图只记录到 AI 开始理解反馈，优化后的歌单待补截图。」
- 左：完整的 `spotify-refine.webp`，`ratio 1179/2556`
- 右 a「之前　AI 把需求诠释为『轻电子』」：`ratio 3.18`，`crop 50% 49.7%`，`focus .43`
- 右 b「反馈　用户否定了这个方向」：`ratio 2.98`，`crop 50% 67.5%`，`focus .57`，`emphasis`
- 右 c「之后　AI 开始重新理解需求」：`ratio 3.55`，`crop 50% 85.1%`，`focus .74`

---

## 9. 素材

### 9.1 已有（`reference/img/`）

| 文件 | 内容 | 用于 |
|---|---|---|
| `spotify-refine.webp` | Spotify 对话优化：「Songs for rainy afternoon for coding…」→「I don't like electronic music」 | 图 1、图 3、图 4、第 03 章 |
| `qq-playlist.webp` | QQ 音乐智能歌单「想哭的快乐」，含 AI 提示词与逐首理由；用户名已打码 | 图 1（主图）、图 3、第 03 章、首页封面 |
| `qq-chat.webp` | QQ 音乐 AI 对话推荐（入口名称待作者确认） | 图 1 |

### 9.2 可选补充（有则替换，无则对应位置只用文字，**不放占位图**）

| ID | 内容 | 用于 |
|---|---|---|
| S1 | Spotify Prompt 输入页与提示词示例 | 04.1、第 03 章 |
| S2 | QQ 智能歌单结构化选项 | 04.1、第 03 章 |
| S3–S5 | 「陌生城市的周日下午」初始结果、优化输入、优化后结果 | 04.2（可新增一组 `before-after`） |
| 优化后歌单 | 图 4 那段对话之后的新歌单 | 图 4 补全 |
| S7–S11 | 单曲 Keep/Remove、更新频率、覆盖提示与 Revert、QQ 更新周期与历史版本 | 04.3、06、第 03 章 |
| 测试条件 | 原稿中的测试条件图片或其中的数据 | 02 表格 |

### 9.3 导出规格

手机竖屏截图，宽 1080–1179px，WebP（质量约 82）。头像、用户名、手机号等个人信息打码。同一组截图尽量同一时期、同一系统语言。原图放进文章的 `images/` 文件夹，尺寸由 `astro:assets` 处理。

---

## 10. 字体与国内访问

正式站**不请求任何境外字体或 CDN**（Google Fonts 在国内经常无法访问）。

- Schibsted Grotesk：把 woff2 放进 `public/fonts/`（来源：Fontsource 或 Google Fonts 下载），在 `base.css` 里用 `@font-face` 声明，加 `font-display: swap`，并对正文字重做 `preload`。
- 中文黑体：只用系统字体，不下载。
- 宋体子集：`scripts/subset-quote-font.mjs` 在构建前扫描所有 MDX 中 `Log`、`HeroFigure.prompt` 和其他使用 `--quote` 的文字，用 `subset-font`（npm）从 Noto Serif SC 500 生成 `public/fonts/quote-serif.woff2`，`@font-face` 名称为 `Quote Serif`。源字体文件放在 `scripts/fonts-src/`（不提交到仓库，或用 Git LFS）。子集生成失败时不阻塞构建，回退到系统宋体。
- 上线后请作者找人在国内用手机流量实测打开速度。GitHub Pages 在国内访问可能不稳定，这是改用自定义域名的主要原因之一。

---

## 11. 部署：GitHub Pages，预留自定义域名

**astro.config.mjs**：`site` 和 `base` 从环境变量读取，切换域名时不改代码。

```js
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://<github-username>.github.io',
  base: process.env.BASE_PATH ?? '/<repo-name>',
  output: 'static',
  trailingSlash: 'always',
  integrations: [mdx()],
});
```

- 所有站内链接和图片路径都通过 `utils/url.ts` 拼接 `import.meta.env.BASE_URL`，**不写死以 `/` 开头的路径**。
- `.github/workflows/deploy.yml`：推送到 `main` 时，用 `withastro/action` 构建，再用 `actions/deploy-pages` 发布。仓库 Settings → Pages → Source 选 **GitHub Actions**。
- **切换自定义域名**：在 `public/` 添加 `CNAME`（写域名），workflow 里设 `SITE_URL=https://<domain>`、`BASE_PATH=/`，再到仓库 Pages 设置里填写域名并开启 HTTPS。
- **第一个里程碑就要部署成功**，之后每次提交都能在线上看到效果。

---

## 12. 需要作者提供或确认

| 项 | 状态 |
|---|---|
| GitHub 用户名与仓库名 | 待提供 |
| 署名（页眉、页脚、分享卡片） | 待提供 |
| 联系方式（邮箱 / GitHub / 其他），页脚显示 | 待提供 |
| 首页站点简介一句话 | 待提供；没有就不显示 |
| `qq-chat.webp` 的入口名称（是否为 QQ 音乐 AI 对话） | 待确认 |
| `qq-playlist.webp` 中的用户名是否需要打码 | 当前已打码 |
| 测试条件表格数据 | 待提供 |
| Spotify Keep 在自动更新后是否生效 | 待实测；结果出来后可能需要改第六章机制二的措辞 |

---

## 13. 开发顺序

1. **骨架与部署**：初始化 Astro、TypeScript、MDX；写好 `tokens.css`、`base.css`；做好 `BaseLayout`、`SiteHeader`、`SiteFooter`；配好 GitHub Actions，部署出一个空首页。
2. **文章页**：内容集合与 schema；把母稿转成 `index.mdx`；完成 `ArticleHeader`、`prose.css`（含表格）、`Verdict`、`Sidenote`、`SectionBreak`、`Log`。
3. **图片**：`HeroFigure`、`Figure`（四种 layout）、`StageMatrix`、Lightbox；放入已有截图。
4. **首页与收尾**：首页按 §4.2 的规则生成；404；每页的 `<title>`、description、Open Graph 图（用封面）。
5. **字体与验收**：字体自托管与宋体子集；按 §14 逐条验收，修完再交付。

每一步结束后提交一次，并说明完成了什么、和规范有什么偏差。

---

## 14. 验收标准

**内容**
- [ ] 文章文字与 `case-01-source.md` 一致，没有新增观点、数据、功能或结论
- [ ] 所有「待验证」的内容仍然标为待验证，候选方案没有被写成已上线或已验证
- [ ] 首页只有真实文章，没有示例条目、占位卡片或灰色图片位

**视觉**
- [ ] 颜色、字级、宽度和间距全部来自 `tokens.css`，没有零散的硬编码值
- [ ] ✱ 只出现在标志和章节分隔两处；原话全部使用宋体，作者观点全部使用黑体
- [ ] 没有 §5.7 列出的任何元素
- [ ] 深色模式下所有文字可读，截图不反色

**图片**
- [ ] 每张截图都能点击和用键盘放大；方向键、Esc、焦点返回都正常
- [ ] 放大后手机截图里的小字清晰可读（原图宽 ≥1080px）
- [ ] 图注统一为两行格式；对照组写明了比较范围
- [ ] 截图上没有框选、箭头或文字标注

**响应式**
- [ ] 375、768、1280、1440 宽度下页面没有横向滚动（`StageMatrix` 和 `row` 的内部滚动除外）
- [ ] 手机端正文 ≥16px，点击区域 ≥44px

**性能与可访问性**
- [ ] Lighthouse（手机）：性能 ≥90、可访问性 ≥95、最佳实践 ≥95、SEO ≥95
- [ ] 不请求 fonts.googleapis.com 或其他境外字体和 CDN
- [ ] 放大用的原图不在首屏加载；首屏之外的图片懒加载
- [ ] 所有图片都有有意义的 alt；标题层级连续；页面 `lang="zh-CN"`

**部署**
- [ ] 推送 `main` 后自动部署到 GitHub Pages，项目子路径下所有链接和图片正常
- [ ] 只改环境变量和 `CNAME` 就能切换到自定义域名
- [ ] 没有任何服务器端运行时、数据库或第三方脚本
