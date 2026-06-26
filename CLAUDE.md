# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Nebula 星云 is a **product design documentation site** — not an application. It is a set of ~31 hand-written static HTML pages (in Chinese, `lang="zh-CN"`) describing a fictional/proposed Marketing Automation Agent product. There is no build step, no JavaScript app, no backend, no tests. Tailwind is loaded from a CDN at runtime; the only local asset is `docs/css/style.css`.

## Commands

- **Preview locally**: serve `docs/` as the web root, e.g. `python3 -m http.server -d docs 8000` then open `http://localhost:8000/`. (There is no dev server configured in `vercel.json`.)
- **Deploy**: pushing to `main` auto-deploys via the linked Vercel project (`nebula`). Manual deploy: `vercel --prod`. Live URL: https://nebula-eight-taupe.vercel.app
- `vercel.json` sets `outputDirectory: docs` and rewrites all paths into `/docs/$1`, so links in the HTML are relative to `docs/` (the live site root = `docs/`).

## Architecture / structure

All content lives under `docs/`. Pages are grouped by the product's three plugin categories, which is the organizing principle of the whole product:

- `docs/channels/` — **9 渠道 (channel) Skills**: wechat, wecom, mp, miniapp, website, feishu, dingtalk, sms, email
- `docs/content/` — **5 内容 (content) Skills**: template, asset, abtest, personalization, hub
- `docs/activity/` — **6 活动 (activity) Skills**: automation, trigger, scoring, analytics, webinar, offline
- Top-level pages: `index.html` (overview), `quickstart.html`, `concepts.html`, `data.html`, `case.html`, `api.html`, `sdk.html`, `faq.html`
- Each category folder has its own `index.html` ("总览" / overview).

The empty top-level `core/`, `skills/`, and `generated-images/` directories are scaffolding and are **not** part of the deployed site (only `docs/` is served).

## Conventions for editing pages

Every page follows the same self-contained template — there is no templating engine, so shared structure is **duplicated in every file**:

1. `<head>` loads `https://cdn.tailwindcss.com` then the local stylesheet (`css/style.css` at root, `../css/style.css` one level deep).
2. A full `<nav class="sidebar">` listing every page. **The sidebar is copy-pasted into all ~31 pages.** When you add, remove, or rename a page, you must update the sidebar block in *every* page, and fix relative paths (`href="..."` at root vs `href="../..."` in subfolders).
3. The current page in the sidebar is marked active with `class="... text-blue-600 bg-blue-50 border-l-2 border-blue-500 font-medium ..."` (other links use `text-gray-500 hover:...`).
4. `<main class="main ... max-w-4xl">` holds the body; subpages start with a breadcrumb (`Nebula / 渠道总览 / …`).
5. Footer line: `Nebula 星云 — Marketing Automation Agent · 产品设计文档 v0.2`.

Styling is Tailwind utility classes inline. `docs/css/style.css` defines only a few custom helpers used across pages: `.sidebar`/`.main` (fixed 260px sidebar + matching left margin, hidden under 768px), `.code-block`, `.inline-code`, `.skill-tag`, `.step-num`, `.method-tag`. Reuse these rather than reinventing.

Channel/content/activity Skill pages share a recurring section layout: a `skill-tag` next to the H1, then 能力列表 (capabilities) / 触发事件 (trigger events, shown as `inline-code` event names) / 配置参数 (a JSON `code-block`). Match this when adding a new Skill page.

Because there is no build or lint step, the way to verify a change is to open the page in a browser and check the sidebar/links render and navigate correctly.
