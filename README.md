# 童心灯塔 · 成长故事馆

> 面向 **4–14 岁**孩子的原创故事资源站。用一篇篇好故事，从生活习惯、精神世界、价值观、文化素养等方方面面，陪伴孩子慢慢长大。

基于 [Hugo](https://gohugo.io) 构建的纯静态站点，可一键部署到 **GitHub Pages**。

---

## 站点特色

- **篇幅扎实**：每篇故事 **8000–15000 字**，是一段可以沉浸其中的完整旅程。
- **分龄分级**：按 4 个年龄段划分，语言难度、情节复杂度与主题深度逐级递进。
- **主题全面**：覆盖 7 大主题分类。
- **阅读友好**：章节目录、字号调节、阅读进度条、读后思考、相关故事推荐，支持打印。

## 信息架构

### 年龄段（taxonomy: `ages`）

| slug | 名称 | 学段 | 定位 |
|------|------|------|------|
| `4-6` | 4–6 岁 | 幼儿园 | 幼儿启蒙：语言简单温暖，适合亲子共读 |
| `7-9` | 7–9 岁 | 小学低年级 | 想象力与品格塑造 |
| `10-12` | 10–12 岁 | 小学高年级 | 文化底蕴与思维方法 |
| `13-14` | 13–14 岁 | 初中 | 青春心事、成长与选择 |

### 故事分类（taxonomy: `categories`）

| slug | 名称 |
|------|------|
| `life-habits` | 生活习惯与自理 |
| `emotion` | 情绪与心理健康 |
| `values` | 品德与价值观 |
| `culture` | 传统文化与文学素养 |
| `science` | 科学启蒙与自然 |
| `imagination` | 想象力与奇幻冒险 |
| `social` | 人际交往与社会认知 |

> 分类与年龄段的展示名、图标、配色等元数据，集中在 `data/ages.yaml` 和 `data/categories.yaml` 中维护。

---

## 目录结构

```
kids-stories/
├── hugo.toml                 # 站点配置（baseURL、taxonomy 等）
├── archetypes/story.md       # 故事内容模板
├── content/
│   ├── _index.md             # 首页
│   ├── about.md              # 关于页
│   └── stories/              # 所有故事放在这里
├── data/
│   ├── ages.yaml             # 年龄段元数据
│   └── categories.yaml       # 分类元数据
├── layouts/                  # 主题模板（首页/列表/详情/分类页等）
├── assets/
│   ├── css/main.css          # 样式
│   └── js/main.js            # 交互（进度条、字号、菜单等）
├── static/                   # 静态资源（favicon 等）
└── .github/workflows/hugo.yml # GitHub Pages 自动部署
```

---

## 本地运行

前置要求：安装 Hugo（Extended 版本，建议 v0.130+）。

```bash
# 启动开发服务器（自动热重载）
hugo server -D

# 打开浏览器访问 http://localhost:1313/
```

生成静态站点：

```bash
hugo --minify          # 产物输出到 public/
```

---

## 新增一篇故事

### 1. 用模板生成

```bash
hugo new content stories/my-story-slug.md
```

### 2. 填写 front matter

```yaml
---
title: "故事标题"
slug: "my-story-slug"        # URL 中的唯一标识（英文小写连字符）
date: 2026-08-31
draft: true                  # 正式发布前改为 false
ages: ["7-9"]                # 参考上方年龄段 slug
categories: ["imagination"]  # 参考上方分类 slug
tags: ["奇幻", "冒险"]
summary: "一句话简介（≤60字）"
moral: "一句话主旨，孩子读完能带走的一句话"
author: "童心灯塔编辑部"
coverEmoji: "🦄"             # 卡片与详情页封面表情
---
```

### 3. 写正文

- 每章用 `## 第一章 · 章节标题` 作为二级标题（会自动进入目录）。
- 结尾用 `## 读后想一想`，列出 3–5 个引导孩子思考的问题。
- 全文简体中文，正文 8000–15000 字。

---

## 部署到 GitHub Pages

> 本仓库采用「双分支」结构：`story` 分支存放故事站（由 GitHub Pages 部署），`main` 分支存放《中华五千年历史简说》README（与故事站无关）。

1. 把本目录推到 GitHub 仓库的 `story` 分支。
2. `hugo.toml` 中的 `baseURL` 已设为 `https://lifepagee.github.io/stroytime/`（项目页地址，可按需修改）。
3. 打开仓库 **Settings → Pages**，将 **Source** 改为 **GitHub Actions**（并确认部署分支为 `story`）。
4. 推送 `story` 分支后，`.github/workflows/hugo.yml` 会自动构建并部署；也可在 **Actions** 页手动触发。

> 提示：工作流文件里 `HUGO_VERSION` 建议与本机开发版本保持一致。

---

## 版权

© 2026 童心灯塔 · 成长故事馆。站内故事均为原创，转载或商用请注明出处。
