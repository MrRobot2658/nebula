# Nebula 星云

Marketing Automation Agent — 以 ChatUI 为核心交互，9 渠道 / 5 内容 / 6 活动 Skill 插件化架构。

🚀 **在线访问**: [https://nebula-eight-taupe.vercel.app](https://nebula-eight-taupe.vercel.app)

## 项目结构

```
site/                官网（产品介绍）
├── index.html       ← 落地页（Hero / 能力 / 案例 / 对比 / FAQ）
└── docs/
    └── index.html   ← 产品文档阅读器（渲染 prd/ 下的 Markdown）

prd/                 产品文档（PRD）源文件 —— 文档站点的内容来源
├── README.md        ← 文档索引
├── 00-product-overview.md   ← 产品总览
├── 01-concepts.md           ← 核心概念
├── 02-data-layer.md         ← 统一数据层
├── 03-api-sdk.md            ← API & SDK
├── channels/        ← 9 个渠道 Skill PRD
├── content/         ← 5 个内容 Skill PRD
└── activity/        ← 6 个活动 Skill PRD

vercel.json          路由：/ → 官网，/docs → 产品文档
```

## 路由

| 路径 | 内容 |
| --- | --- |
| `/` | 官网落地页 `site/index.html` |
| `/docs/` | 产品文档站 `site/docs/index.html`（按 `#/<模块>` 哈希路由） |
| `/prd/**.md` | PRD Markdown 源文件（被文档站 `fetch` 渲染） |

## 技术栈

- Tailwind CSS (CDN) + marked.js（Markdown 渲染）
- Vanilla HTML / JS，无构建步骤
- Vercel（部署）

## 本地预览

```bash
# 在仓库根目录启动静态服务器（让 /prd/*.md 可被 fetch）
python3 -m http.server 8000
# 官网： http://localhost:8000/site/
# 文档： http://localhost:8000/site/docs/
```

> 部署后由 `vercel.json` 的 rewrites 将 `/` 与 `/docs` 映射到 `site/` 下对应页面。
