# 知微 · 澄读升级版

> 这是 [澄读](https://cdreader.top) 的升级版。旧版源码：[xkc123456/chengdu-paper-reader](https://github.com/xkc123456/chengdu-paper-reader)。

知微把论文、教材章节和课件拆成「老师讲得明白、你能复述」的样子：先讲直觉，再拆术语与机制，最后回到原文核对证据。读完还能接着练题、收错题、按遗忘曲线复习、排学习计划——从读懂到记住，在一张书桌上完成。

## 功能

- **澄读 · 精读**：论文 / 教材章节 / 讲义课件三类材料，各用一套拆法。
- **五种视图**：老师讲解、主体关系、分栏对照、原文定位、追问老师。
- **练与复习**：自动出理解题、错题本、术语记忆卡片（间隔重复）、学习计划。
- **复述检验**：合上讲解，用自己的话复述，AI 指出漏掉的要点。
- **自带 Key**：DeepSeek Key 只存在访客自己的浏览器里，随请求转发，不落库、不进日志。
- **云端存档**：登录后精读记录、错题、卡片和计划跨设备同步。

## 技术栈

- [TanStack Start](https://tanstack.com/start) + React 19 + TypeScript
- Tailwind CSS v4 + Radix UI（水墨 + 宣纸 + 朱印的设计系统）
- Supabase（邮箱 / Google 登录、Postgres、行级权限）
- DeepSeek（OpenAI 兼容接口，访客自带 Key）

## 本地开发

需要 Node.js 20+ 和一个 Supabase 项目。

```bash
npm install
cp .env.example .env    # 填入 Supabase 项目地址与 publishable key
npm run dev
```

数据库结构见 `drizzle/migrations/0000_create_learning_workspace.sql`，在 Supabase SQL Editor 里执行一次即可。

```bash
npm run test     # 单元测试
npm run lint     # ESLint
npm run build    # 生产构建
```

## 环境变量

| 变量 | 用途 |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase 项目 URL（浏览器端） |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key（浏览器端） |
| `SUPABASE_URL` | 服务端校验登录态用 |
| `SUPABASE_PUBLISHABLE_KEY` | 服务端校验登录态用 |
| `SUPABASE_SERVICE_ROLE_KEY` | 可选：服务端管理操作，不能进前端 |

## 部署

本项目由 [Lovable](https://lovable.dev) 生成，默认面向 Lovable Cloud（内置 Supabase 与 Google 登录代理）。

自行部署时需要：

1. 新建 Supabase 项目，执行上面的迁移 SQL，配置邮箱登录；Google 登录需要把 `src/components/app/SocialButtons.tsx` 从 Lovable 的 OAuth 代理换成 Supabase 原生 OAuth。
2. 提供上表环境变量。
3. 用 Nitro 的 Node 或 Cloudflare Workers 目标托管（`vite.config.ts` 已由 Lovable 预设，默认 Cloudflare）。

## 与旧版的关系

| | 旧版 | 新版（本仓库） |
| --- | --- | --- |
| 前端 | Vite SPA | TanStack Start（SSR） |
| 后端 | Cloudflare Worker + Hono | TanStack Server Functions |
| 存储 | Cloudflare KV（存档 / 分享 / 院校上报）、R2（收件箱） | Supabase Postgres |
| 身份 | 无账号，设备 ID + Cookie | 邮箱 / Google 账号 |
| 模型 | 访客自带 DeepSeek Key | 访客自带 DeepSeek Key |

两版的数据模型不同：旧版按设备 ID 存 KV，新版按账号存 Postgres。旧版存档不会自动出现在新版里，需要单独做迁移或桥接。

## 目录

```text
src/routes/            页面（首页 / 登录 / 书桌 / 精读 / 练题 / 错题 / 复习 / 计划 / 设置）
src/components/read/   精读视图组件（讲解、术语、关系、对照、复述、追问）
src/components/app/    应用外壳、登录、Key 弹窗、答题器
src/lib/prompts.ts     提示词与结构化输出契约（Zod）
src/lib/ai.functions.ts  DeepSeek 转发（服务端函数，不落 Key）
src/integrations/      Supabase 客户端、登录中间件、Lovable OAuth
drizzle/migrations/    数据库结构
roadmap.md             进度
```
